/**
 * RTF -> HTML importer.
 *
 * RTF is a nested group format: `{ group \controlword<number> text }`. Reading
 * it needs three things this file provides:
 *
 *  1. A tokenizer separating group braces, control words, control symbols
 *     (`\'hh`, `\\`, `\{`) and literal text.
 *  2. A state stack, because every `{` pushes a copy of the character and
 *     paragraph state and every `}` pops it. That is what makes `{\b bold}` and
 *     `{\i italic}` compose the way Word writes them.
 *  3. Destination handling. RTF embeds font tables, colour tables, style sheets
 *     and document metadata as destinations whose contents are NOT body text.
 *     Rendering them would spray `Courier New` and `\red255\green0\blue0` into
 *     the document, so they are captured or skipped.
 *
 * Scope: paragraphs, headings (via \outlinelevel), bold/italic/underline/
 * strike/sub/super, font size, colour, highlight, alignment, indents, bulleted
 * and numbered lists, tables, hyperlinks, tabs/line breaks, unicode (`\uN?`)
 * and ANSI (`\'hh`) escapes.
 *
 * Not covered: embedded pictures (`\pict`), fields other than HYPERLINK,
 * footnotes/endnotes, headers/footers and tracked changes. Those destinations
 * are skipped rather than rendered as garbage.
 */

/** Escape text for the editor's HTML parser. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * CP1252 differs from Latin-1 only in 0x80-0x9F, where RTF's `\'hh` escapes
 * and Word both assume Windows-1252. Without this table smart quotes and
 * dashes arrive as mojibake.
 */
const CP1252_HIGH: Record<number, string> = {
  0x80: "\u20AC", 0x82: "\u201A", 0x83: "\u0192", 0x84: "\u201E", 0x85: "\u2026",
  0x86: "\u2020", 0x87: "\u2021", 0x88: "\u02C6", 0x89: "\u2030", 0x8A: "\u0160",
  0x8B: "\u2039", 0x8C: "\u0152", 0x8E: "\u017D", 0x91: "\u2018", 0x92: "\u2019",
  0x93: "\u201C", 0x94: "\u201D", 0x95: "\u2022", 0x96: "\u2013", 0x97: "\u2014",
  0x98: "\u02DC", 0x99: "\u2122", 0x9A: "\u0161", 0x9B: "\u203A", 0x9C: "\u0153",
  0x9E: "\u017E", 0x9F: "\u0178",
};

function byteToChar(code: number): string {
  return CP1252_HIGH[code] ?? String.fromCharCode(code);
}

interface CharState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  sub: boolean;
  sup: boolean;
  /** Half-points, as RTF stores them. 0 means "inherit". */
  size: number;
  color: string | null;
  highlight: string | null;
}

interface ParaState {
  align: "left" | "center" | "right" | "justify" | null;
  /** Twips. */
  left: number;
  firstLine: number;
  /** 0 = body text, 1..3 = heading level. */
  outline: number;
  /** Set from `\pnlvlblt` / `\pndec` when Word writes it inline. */
  list: "ul" | "ol" | null;
  /** `\lsN` list-table id, resolved when the paragraph ends. */
  listRef: string | null;
  /** `\ilvlN` nesting level. */
  level: number;
}

interface Frame {
  char: CharState;
  para: ParaState;
  /** Skip every character until this group closes. */
  skip: boolean;
  /** Fallback characters to swallow (after `\uN?` or `\binN`). */
  skipChars: number;
}

/**
 * A destination whose raw text we need to read.
 *
 * Kept outside the frame stack on purpose: `\listtable` contains nested `{\list
 * ...}` groups, and a per-frame buffer would be discarded when each nested group
 * popped. `depth` is the stack depth the destination opened at, so the buffer
 * closes when that group does.
 */
type Capture = { kind: "colortbl" | "listtable" | "instr"; text: string; depth: number };

function freshChar(): CharState {
  return {
    bold: false, italic: false, underline: false, strike: false,
    sub: false, sup: false, size: 0, color: null, highlight: null,
  };
}

function freshPara(): ParaState {
  return { align: null, left: 0, firstLine: 0, outline: 0, list: null, listRef: null, level: 0 };
}

/** Destinations whose contents are metadata, never body text. */
const SKIP_DESTINATIONS = new Set([
  "fonttbl", "stylesheet", "info", "listoverridetable", "revtbl",
  "rsidtbl", "generator", "xmlnstbl", "themedata", "colorschememapping",
  "latentstyles", "datastore", "docvar", "pntext", "listtext", "header",
  "footer", "headerl", "headerr", "headerf", "footerl", "footerr", "footerf",
  "footnote", "ftnsep", "ftnsepc", "ftncn", "aftnsep", "aftnsepc", "aftncn",
  "bkmkstart", "bkmkend", "annotation", "atnid", "atnauthor", "atnref",
  "atrfstart", "atrfend", "pict", "object", "result", "nonshppict", "shppict",
  "mmath", "do", "shp", "shpgrp", "shpinst", "falt",
  "blipuid", "template", "userprops", "formfield", "datafield", "fchars", "pntxta", "pntxtb",
]);

/** Control-word symbols that stand for a literal character. */
const SYMBOL_CHARS: Record<string, string> = {
  "~": "\u00A0", // non-breaking space
  "-": "\u00AD", // optional hyphen
  "_": "\u2011", // non-breaking hyphen
  emdash: "\u2014",
  endash: "\u2013",
  lquote: "\u2018",
  rquote: "\u2019",
  ldblquote: "\u201C",
  rdblquote: "\u201D",
  bullet: "\u2022",
  ellipsis: "\u2026",
};

/**
 * Is this `levelnfc` a bullet rather than a number?
 *
 * Word stores the visual format of a list level in the `\listtable`
 * destination. `\levelnfc23` is the bullet glyph marker; 255 and 97 also mean
 * "no number". Everything else is some kind of ordered numbering.
 */
const BULLET_NFC = new Set([23, 255, 97]);

/**
 * Parse `\listtable` into `listId:level -> isBullet`.
 *
 * Word hides list bullets inside `{\*\pn ...}` groups, which are explicitly
 * ignorable, so the only reliable source of "is this list a bullet or a number"
 * is the list table itself.
 */
function parseListTable(raw: string): Map<string, boolean> {
  const map = new Map<string, boolean>();
  // Each `\list` block carries a `\listid` and one `\listlevel` per level.
  for (const listBlock of raw.split(/\\list(?![a-z])/)) {
    const id = /\\listid(\d+)/.exec(listBlock)?.[1];
    if (!id) continue;
    const levels = listBlock.match(/\\levelnfc(\d+)/g) ?? [];
    levels.forEach((token, index) => {
      const nfc = Number(/\\levelnfc(\d+)/.exec(token)?.[1] ?? "0");
      map.set(`${id}:${index}`, BULLET_NFC.has(nfc));
    });
  }
  return map;
}

/** Wrap runs of `<li data-list="...">` in the matching `<ul>`/`<ol>`. */
function wrapLists(blocks: string[]): string[] {
  const out: string[] = [];
  let open: "ul" | "ol" | null = null;
  for (const b of blocks) {
    const m = /^<li data-list="(ul|ol)">/.exec(b);
    if (m) {
      const kind = m[1] as "ul" | "ol";
      if (open !== kind) {
        if (open) out.push(`</${open}>`);
        out.push(`<${kind}>`);
        open = kind;
      }
      out.push(b.replace(/^<li data-list="(ul|ol)">/, "<li>"));
    } else {
      if (open) {
        out.push(`</${open}>`);
        open = null;
      }
      out.push(b);
    }
  }
  if (open) out.push(`</${open}>`);
  return out;
}

/** Parse an RTF colour table (`;\red..\green..\blue..;`) into CSS colours. */
function parseColorTable(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((entry) => {
      const r = /\\red(\d+)/.exec(entry);
      const g = /\\green(\d+)/.exec(entry);
      const b = /\\blue(\d+)/.exec(entry);
      if (!r || !g || !b) return "";
      const hex = [r[1], g[1], b[1]]
        .map((v) => Number(v).toString(16).padStart(2, "0"))
        .join("");
      return `#${hex}`;
    })
    .filter((c) => c !== "");
}

/**
 * Parse RTF into HTML for the editor.
 * Returns null when the input is not RTF at all.
 */
export function parseRtf(data: Uint8Array | string): string | null {
  const text = typeof data === "string" ? data : new TextDecoder().decode(data);
  if (!/^\s*\{\\rtf\d/.test(text)) return null;

  const len = text.length;
  let i = 0;

const stack: Frame[] = [];
  let cur: Frame = { char: freshChar(), para: freshPara(), skip: false, skipChars: 0 };
  let capture: Capture | null = null;

  /** Completed blocks for the current container (document body or table cell). */
  const body: string[] = [];
  let blocks: string[] = [];
/** Inline content of the paragraph currently being read. */
  let paraText = "";
  /** Pending raw text of the current uniformly-formatted run. */
  let runText = "";
  let runSig = "";
  let runChar: CharState = freshChar();
  let runLink: string | null = null;
  let cells: string[] = [];
  let colors: string[] = [];
  let listFormats = new Map<string, boolean>();
  let linkUrl: string | null = null;
  /** Group depth at which the current hyperlink started. */
  let linkDepth = -1;
  let inRow = false;

/**
   * Identity of the current run formatting. RTF sets properties *before* the
   * text they apply to (`\b bold\b0`), so the formatting a run was written with
   * has to be captured as the text is read, not read back later.
   */
  const sigOf = () => {
    const c = cur.char;
    return [
      c.bold ? 1 : 0, c.italic ? 1 : 0, c.underline ? 1 : 0, c.strike ? 1 : 0,
      c.sub ? 1 : 0, c.sup ? 1 : 0, c.size, c.color ?? "", c.highlight ?? "",
      linkUrl ?? "",
    ].join("|");
  };

  const addText = (value: string) => {
    if (!value) return;
    // A live capture swallows text regardless of skip state: destinations we
    // need (`\colortbl`, `\listtable`, `\fldinst`) are themselves marked
    // ignorable by Word.
    if (capture && stack.length >= capture.depth) {
      capture.text += value;
      return;
    }
    if (cur.skip) return;
    const sig = sigOf();
    // Adjacent text sharing formatting stays in one run, so we emit one
    // <strong> instead of one per character.
    if (runText && sig !== runSig) flushRun();
    if (!runText) {
      runSig = sig;
      runChar = { ...cur.char };
      runLink = linkUrl;
    }
    runText += value;
  };

  /** Emit the pending run into the current paragraph and close it. */
  const flushRun = (): string => {
    if (!runText) return paraText;
    let out = escapeHtml(runText);
    runText = "";
    const c = runChar;
    // Fixed nesting order keeps the HTML stable and re-parseable.
    if (c.color) out = `<span style="color:${c.color}">${out}</span>`;
    if (c.highlight) out = `<mark>${out}</mark>`;
    if (c.size > 0) out = `<span style="font-size:${Math.round(c.size / 2)}pt">${out}</span>`;
    if (c.sub) out = `<sub>${out}</sub>`;
    else if (c.sup) out = `<sup>${out}</sup>`;
    if (c.strike) out = `<s>${out}</s>`;
    if (c.underline) out = `<u>${out}</u>`;
    if (c.italic) out = `<em>${out}</em>`;
    if (c.bold) out = `<strong>${out}</strong>`;
    if (runLink) out = `<a href="${escapeHtml(runLink)}">${out}</a>`;
    paraText += out;
    return paraText;
  };

const endParagraph = () => {
    flushRun();
    const inline = paraText;
    paraText = "";
    const p = cur.para;
    const style: string[] = [];
    if (p.align) style.push(`text-align:${p.align}`);
    if (p.left) style.push(`margin-left:${Math.round(p.left / 20)}pt`);
    if (p.firstLine) style.push(`text-indent:${Math.round(p.firstLine / 20)}pt`);
    const styleAttr = style.length ? ` style="${style.join(";")}"` : "";

    if (p.list) {
      pushBlock(`<li data-list="${p.list}">${inline}</li>`);
    } else if (p.listRef) {
      // `\lsN` names a list in the list table, which knows whether it is a
      // bullet or a number. Unknown lists default to a bullet.
      const bullet = listFormats.get(`${p.listRef}:${p.level}`) ?? true;
      pushBlock(`<li data-list="${bullet ? "ul" : "ol"}">${inline}</li>`);
    } else if (p.outline >= 1 && p.outline <= 3) {
      pushBlock(`<h${p.outline}>${inline}</h${p.outline}>`);
    } else if (inRow) {
      // Inside a table an empty paragraph is still a cell's content.
      pushBlock(`<p${styleAttr}>${inline}</p>`);
    } else if (inline || !style.length) {
      // Outside a table, an empty paragraph keeps paragraph spacing from
      // collapsing.
      pushBlock(`<p${styleAttr}>${inline}</p>`);
    }
    cur.para = freshPara();
  };

  /**
   * Route a finished block to the right container: table cells accumulate
   * their own blocks, everything else belongs to the document body.
   */
  const pushBlock = (html: string) => {
    if (inRow) blocks.push(html);
    else body.push(html);
  };

  const endCell = () => {
    flushRun();
    // Text that never hit a `\par` still belongs to this cell.
    if (paraText) blocks.push(`<p>${paraText}</p>`);
    paraText = "";
    cells.push(blocks.join(""));
    blocks = [];
    cur.para = freshPara();
  };

  const endRow = () => {
    flushRun();
    const pending = paraText ? `<p>${paraText}</p>` : "";
    paraText = "";
    if (pending || blocks.length) cells.push(blocks.join("") + pending);
    blocks = [];
    if (cells.length) {
      body.push(
        `<table><tbody><tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr></tbody></table>`,
      );
    }
    cells = [];
    cur.para = freshPara();
    inRow = false;
  };

  const readNumber = (): number | null => {
    let start = i;
    // RTF control-word arguments are signed: `\fi-360` is a negative indent.
    if (text[i] === "-") i++;
    const digits = i;
    while (i < len && text[i] >= "0" && text[i] <= "9") i++;
    if (i === digits) {
      // Not a number: leave the cursor where it was.
      i = start;
      return null;
    }
    return Number(text.slice(digits, i));
  };

  while (i < len) {
    const ch = text[i];

    if (ch === "{") {
      i++;
stack.push({
        char: { ...cur.char },
        para: { ...cur.para },
        skip: cur.skip,
        skipChars: cur.skipChars,
      });
      continue;
    }

    if (ch === "}") {
      i++;
      // A hyperlink ends with the group that opened `\field`.
      if (linkDepth >= 0 && stack.length <= linkDepth) {
        linkUrl = null;
        linkDepth = -1;
      }
const prev = stack.pop();
      if (prev) {
        // Close the run so the next group starts a fresh formatting run.
        flushRun();
        cur = prev;
      }
      // A capture ends when the group that opened it closes.
      if (capture && stack.length < capture.depth) {
        if (capture.kind === "colortbl") colors = parseColorTable(capture.text);
        else if (capture.kind === "listtable") listFormats = parseListTable(capture.text);
        // Word writes the hyperlink target in `{\*\fldinst {HYPERLINK "..."}}`,
        // which closes before `\fldrslt` (the visible text) is reached.
        else if (capture.kind === "instr") {
          const m = /HYPERLINK\s+"([^"]*)"/i.exec(capture.text);
          if (m) {
            linkUrl = m[1];
            linkDepth = stack.length;
          }
        }
        capture = null;
      }
      continue;
    }

if (ch === "\\") {
      // Index of the backslash itself, so a captured destination can keep the
      // control words verbatim.
      const tokenStart = i;
      i++;
      if (i >= len) break;
      const next = text[i];
      const captureDepth = capture?.depth;

      // Control symbol: exactly one non-alphanumeric character.
      if (!/[A-Za-z]/.test(next)) {
        i++;
        // Captured destinations keep their symbols raw: `\'B7` inside
        // \listtable is bullet metadata, not document text.
        if (capture !== null && captureDepth !== undefined && stack.length >= captureDepth) {
          capture.text += text.slice(tokenStart, i);
          continue;
        }
        if (next === "'") {
          const code = parseInt(text.substr(i, 2), 16);
          i += 2;
          if (!Number.isNaN(code)) addText(byteToChar(code));
          continue;
        }
        if (next === "*") {
          // `{\*\foo ...}` is an ignorable destination.
          cur.skip = true;
          continue;
        }
        if (next === "\\" || next === "{" || next === "}") {
          addText(next);
          continue;
        }
        if (next === "tab") {
          addText("\t");
          continue;
        }
        if (next === "line") {
          addText("\n");
          continue;
        }
        if (next === "bin") {
          const count = readNumber();
          if (count != null) {
            cur.skipChars = count;
            if (text[i] === " ") i++;
          }
          continue;
        }
        if (SYMBOL_CHARS[next]) addText(SYMBOL_CHARS[next]);
        continue;
      }

      // Control word.
      const start = i;
      while (i < len && /[A-Za-z]/.test(text[i])) i++;
      const word = text.slice(start, i);
const arg = readNumber();
      // A single space after a control word is a delimiter, not text.
      const delimiter = text[i] === " ";
      if (delimiter) i++;

// Destinations we need must be read even inside an ignorable `{\*\...}` group,
      // so handle them before the skip check below.
      if (word === "colortbl") {
        capture = { kind: "colortbl", text: "", depth: stack.length };
        continue;
      }
      if (word === "listtable") {
        capture = { kind: "listtable", text: "", depth: stack.length };
        continue;
      }
      if (word === "fldinst") {
        capture = { kind: "instr", text: "", depth: stack.length };
        continue;
      }

      // Captured destinations keep their control words verbatim, otherwise the
      // colour table would never see `\red255`.
      if (capture !== null && stack.length >= capture.depth) {
        capture.text += text.slice(tokenStart, delimiter ? i - 1 : i);
        continue;
      }

      // Inside a skipped destination only the group structure matters.
      if (cur.skip) continue;

      switch (word) {
        case "par": endParagraph(); break;
        case "cell": endCell(); break;
        case "row": endRow(); break;
        case "trowd":
          // Anything already accumulated belongs to the document, not the row.
          if (blocks.length) body.push(...blocks);
          blocks = [];
          inRow = true;
          cells = [];
          break;
        case "intbl": inRow = true; break;
        case "pard": cur.para = freshPara(); break;
        case "plain": cur.char = freshChar(); break;
        case "tab": addText("\t"); break;
        case "line": addText("\n"); break;
        case "page": pushBlock('<p style="page-break-before:always"></p>'); break;

        // --- character formatting ---
        case "b": cur.char.bold = arg !== 0; break;
        case "i": cur.char.italic = arg !== 0; break;
        case "ul": cur.char.underline = arg !== 0; break;
        case "ulnone": cur.char.underline = false; break;
        case "strike": cur.char.strike = arg !== 0; break;
        case "sub": cur.char.sub = true; cur.char.sup = false; break;
        case "super": cur.char.sup = true; cur.char.sub = false; break;
        case "nosupersub": cur.char.sub = false; cur.char.sup = false; break;
        case "fs": cur.char.size = arg ?? 0; break;
        case "cf":
          cur.char.color = arg != null && arg > 0 ? colors[arg - 1] ?? null : null;
          break;
        case "highlight":
          cur.char.highlight = arg != null && arg > 0 ? colors[arg - 1] ?? null : null;
          break;

        // --- paragraph formatting ---
        case "ql": cur.para.align = "left"; break;
        case "qc": cur.para.align = "center"; break;
        case "qr": cur.para.align = "right"; break;
        case "qj": cur.para.align = "justify"; break;
        case "li": cur.para.left = arg ?? 0; break;
        case "fi": cur.para.firstLine = arg ?? 0; break;
        case "outlinelevel": cur.para.outline = arg ?? 0; break;
        case "ls": cur.para.listRef = arg != null ? String(arg) : null; break;
        case "ilvl": cur.para.level = arg ?? 0; break;

// --- lists ---
        case "pnlvlblt":
        case "pnbullet":
          if (captureDepth === undefined) cur.para.list = "ul";
          break;
        case "pndec":
        case "pnlcrm":
        case "pnlcltr":
        case "pnordinal":
        case "pnucrm":
          if (captureDepth === undefined) cur.para.list = "ol";
          break;

        // --- unicode: `\uN?` where `?` is a fallback to swallow ---
        case "u": {
          if (arg == null) break;
          const code = arg < 0 ? arg + 65536 : arg;
          addText(String.fromCharCode(code));
          // Word emits one fallback char per unit of magnitude (usually 1).
          cur.skipChars = Math.min(Math.abs(arg), 2);
          break;
        }

case "fldrslt": {
          if (capture?.kind === "instr") {
            const m = /HYPERLINK\s+"([^"]*)"/i.exec(capture.text);
            if (m) {
              linkUrl = m[1];
              linkDepth = stack.length;
            }
          }
          capture = null;
          break;
        }

        case "field":
          linkDepth = stack.length;
          break;

default:
          // `\lquote`, `\emdash` and friends are alphabetic control words that
          // stand for a character, not destinations.
          const symbol = SYMBOL_CHARS[word];
          if (symbol !== undefined) {
            addText(symbol);
            break;
          }
          if (SKIP_DESTINATIONS.has(word)) cur.skip = true;
          break;
      }
      continue;
    }

    // Line breaks in the RTF source itself are cosmetic.
    if (ch === "\r" || ch === "\n") {
      i++;
      continue;
    }

if (cur.skipChars > 0) {
      cur.skipChars--;
      i++;
      continue;
    }
    // Plain text in a skipped destination is dropped, but text feeding a live
    // capture (`{\*\fldinst {HYPERLINK "..."}}`) must still be collected.
    if (cur.skip && !(capture && stack.length >= capture.depth)) {
      i++;
      continue;
    }

    const start = i;
    while (i < len && text[i] !== "\\" && text[i] !== "{" && text[i] !== "}") i++;
    addText(text.slice(start, i));
  }

// Commit anything left dangling.
  if (paraText) endParagraph();
  if (blocks.length) body.push(...blocks);
  if (cells.length) endRow();

  return wrapLists(body).join("");
}
