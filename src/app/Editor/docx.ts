/**
 * Minimal .docx writer + reader.
 *
 * A .docx is a ZIP archive of OOXML (Office Open XML) parts. This module
 * writes a small but fully valid package from the editor's HTML (so the
 * file opens in Word / LibreOffice / Google Docs) and reads such files
 * back into HTML so BritDocs can open its own saved documents.
 *
 * The ZIP here uses DEFLATE-free "store" entries plus the UTF-8 filename
 * flag, which keeps the implementation dependency-free.
 */

/* ------------------------------------------------------------------ */
/* ZIP plumbing                                                        */
/* ------------------------------------------------------------------ */

function crc32(data: Uint8Array): number {
  let table: Int32Array | null = null;
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ (table![(crc ^ data[i]) & 0xff] ?? 0);
  return (crc ^ -1) >>> 0;
}

function writeU16(dv: DataView, off: number, v: number) {
  dv.setUint16(off, v, true);
}
function writeU32(dv: DataView, off: number, v: number) {
  dv.setUint32(off, v, true);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/**
 * Build a ZIP archive (store method, UTF-8 names) from file entries.
 */
export function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const offsets: number[] = [];

  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const lh = new Uint8Array(30);
    const dv = new DataView(lh.buffer);
    writeU32(dv, 0, 0x04034b50); // local file header signature
    writeU16(dv, 4, 20); // version needed
    writeU16(dv, 6, 0x0800); // flags: UTF-8
    writeU16(dv, 8, 0); // method: store
    writeU16(dv, 10, 0); // mod time
    writeU16(dv, 12, 0x21); // mod date
    writeU32(dv, 14, crc);
    writeU32(dv, 18, f.data.length); // compressed size
    writeU32(dv, 22, f.data.length); // uncompressed size
    writeU16(dv, 26, name.length);
    writeU16(dv, 28, 0); // extra len

    local.push(lh, name, f.data);

    const c = new Uint8Array(46);
    const cd = new DataView(c.buffer);
    writeU32(cd, 0, 0x02014b50); // central dir signature
    writeU16(cd, 4, 20);
    writeU16(cd, 6, 20);
    writeU16(cd, 8, 0x0800);
    writeU16(cd, 10, 0);
    writeU16(cd, 12, 0);
    writeU16(cd, 14, 0x21);
    writeU32(cd, 16, crc);
    writeU32(cd, 20, f.data.length);
    writeU32(cd, 24, f.data.length);
    writeU16(cd, 28, name.length);
    writeU16(cd, 30, 0);
    writeU16(cd, 32, 0);
    writeU16(cd, 34, 0);
    writeU16(cd, 36, 0);
    writeU32(cd, 38, 0); // external attrs
    writeU32(cd, 42, offset); // local header offset
    central.push(c, name);

    offsets.push(offset);
    offset += 30 + name.length + f.data.length;
  }

  const centralStart = offset;
  const centralData = concatBytes(central);
  const eocd = new Uint8Array(22);
  const ed = new DataView(eocd.buffer);
  writeU32(ed, 0, 0x06054b50);
  writeU16(ed, 4, 0);
  writeU16(ed, 6, 0);
  writeU16(ed, 8, files.length);
  writeU16(ed, 10, files.length);
  writeU32(ed, 12, centralData.length);
  writeU32(ed, 16, centralStart);
  writeU16(ed, 20, 0);

  return concatBytes([...local, centralData, eocd]);
}

/**
 * Extract a stored (uncompressed) file by name from a ZIP archive.
 * Returns null if missing or compressed with an unsupported method.
 */
export function zipRead(data: Uint8Array, wanted: string): Uint8Array | null {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const dec = new TextDecoder();
  let off = 0;
  while (off + 30 <= data.length) {
    if (dv.getUint32(off, true) !== 0x04034b50) break;
    const method = dv.getUint16(off + 8, true);
    const compSize = dv.getUint32(off + 18, true);
    const size = dv.getUint32(off + 22, true);
    const nameLen = dv.getUint16(off + 26, true);
    const extraLen = dv.getUint16(off + 28, true);
    const name = dec.decode(data.subarray(off + 30, off + 30 + nameLen));
    const start = off + 30 + nameLen + extraLen;
    if (name === wanted && method === 0) {
      return data.subarray(start, start + size);
    }
    if (name === wanted && method !== 0) {
      return null; // deflate not supported here
    }
    off = start + compSize;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* OOXML document building                                              */
/* ------------------------------------------------------------------ */

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const CORE_PROPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>BritDocs document</dc:title>
<dc:creator>BritDocs</dc:creator>
<cp:lastModifiedBy>BritDocs</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">2024-01-01T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2024-01-01T00:00:00Z</dcterms:modified>
</cp:coreProperties>`;

const APP_PROPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
<Application>BritDocs</Application>
<Company></Company>
</Properties>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
`;

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Tag name → mark flags as used by the WordprocessingML runs. */
interface RunProps {
  b?: boolean;
  i?: boolean;
  u?: boolean;
  strike?: boolean;
  sub?: boolean;
  sup?: boolean;
  color?: string;
  size?: number;
}

function runPropsXml(props: RunProps): string {
  const parts: string[] = [];
  if (props.b) parts.push("<w:b/>");
  if (props.i) parts.push("<w:i/>");
  if (props.u) parts.push('<w:u w:val="single"/>');
  if (props.strike) parts.push("<w:strike/>");
  if (props.sub) parts.push('<w:vertAlign w:val="subscript"/>');
  if (props.sup) parts.push('<w:vertAlign w:val="superscript"/>');
  if (props.color) parts.push(`<w:color w:val="${esc(props.color.replace(/^#/, ""))}"/>`);
  if (props.size) parts.push(`<w:sz w:val="${props.size}"/><w:szCs w:val="${props.size}"/>`);
  if (parts.length === 0) return "";
  return `<w:rPr>${parts.join("")}</w:rPr>`;
}

/**
 * Convert the editor's HTML (a Tiptap/ProseMirror fragment) into a
 * WordprocessingML <w:document> body. Block structure maps to
 * paragraphs/headings and inline marks map to run properties.
 */
function htmlToDocumentXml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.body;

  const runForText = (text: string, props: RunProps): string => {
    const t = esc(text);
    return `<w:r>${runPropsXml(props)}<w:t xml:space="preserve">${t}</w:t></w:r>`;
  };

  const walkInline = (node: ChildNode, props: RunProps): string => {
    let out = "";
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        out += runForText(child.textContent ?? "", props);
        return;
      }
      if (child.nodeType !== 1) return;
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const next: RunProps = { ...props };
      if (tag === "b" || tag === "strong") next.b = true;
      if (tag === "i" || tag === "em") next.i = true;
      if (tag === "u" || tag === "ins") next.u = true;
      if (tag === "s" || tag === "strike" || tag === "del") next.strike = true;
      if (tag === "sub") { next.sub = true; next.sup = false; }
      if (tag === "sup") { next.sup = true; next.sub = false; }
      if (tag === "br") {
        out += `<w:r><w:br/></w:r>`;
        return;
      }
      if (tag === "a") {
        out += walkInline(child, next);
        return;
      }
      if (tag === "span") {
        const style = el.getAttribute("style") ?? "";
        const color = /color:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]+\))/.exec(style)?.[1];
        if (color) next.color = color;
        const fsize = /font-size:\s*([0-9.]+)px/.exec(style)?.[1];
        if (fsize && parseFloat(fsize) > 0) next.size = Math.round(parseFloat(fsize) * 2); // px → half-points
        out += walkInline(child, next);
        return;
      }
      out += walkInline(child, next);
    });
    return out;
  };

  const paragraphXml = (node: ChildNode, props: RunProps, heading?: number): string => {
    const runs = walkInline(node, props);
    const pPr: string[] = [];
    if (heading) pPr.push(`<w:pStyle w:val="Heading${heading}"/>`);
    if (props.b && heading) pPr.push("<w:rPr><w:b/></w:rPr>");
    const pPrXml = pPr.length > 0 ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
    return `<w:p>${pPrXml}${runs}</w:p>`;
  };

  const blocks: string[] = [];

  body.childNodes.forEach((node) => {
    if (node.nodeType === 3 || node.nodeType === 8) return;
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const level = Number(tag[1]);
      blocks.push(paragraphXml(el, { b: level === 1 }, level));
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      let counter = 0;
      el.querySelectorAll("li").forEach((li) => {
        counter += 1;
        const marker = ordered ? `${counter}. ` : "• ";
        const runs = walkInline(li, {});
        blocks.push(`<w:p><w:r><w:t>${esc(marker)}</w:t></w:r><w:r>${runs}</w:r></w:p>`);
      });
      return;
    }

    if (tag === "table") {
      el.querySelectorAll("tr").forEach((tr) => {
        const cells: string[] = [];
        tr.querySelectorAll("th, td").forEach((td) => {
          const t = (td.textContent ?? "").trim();
          cells.push(`<w:tc><w:p><w:r><w:t>${esc(t)}</w:t></w:r></w:p></w:tc>`);
        });
        if (cells.length > 0) blocks.push(`<w:tr>${cells.join("")}</w:tr>`);
      });
      return;
    }

    if (tag === "hr") {
      blocks.push('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="auto"/></w:pBdr></w:pPr><w:r><w:t/></w:r></w:p>');
      return;
    }

    if (tag === "img") {
      const alt = el.getAttribute("alt") ?? "";
      const src = el.getAttribute("src") ?? "";
      const final = (alt ?? "").length > 0 ? alt : "(image)";
      void src;
      blocks.push(`<w:p><w:r><w:t>${esc(final)}</w:t></w:r></w:p>`);
      return;
    }

    // default paragraph (including p, div, blockquote, li leftovers)
    blocks.push(`<w:p>${walkInline(el, {})}</w:p>`);
  });

  const bodyXml = blocks.join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${bodyXml}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
</w:body>
</w:document>`;
}

/**
 * Serialize an HTML string from the editor into a real, openable .docx
 * binary (BlobPart-ready Uint8Array).
 */
export function buildDocx(html: string): Uint8Array {
  const documentXml = htmlToDocumentXml(html);
  return zipStore([
    { name: "[Content_Types].xml", data: new TextEncoder().encode(CONTENT_TYPES) },
    { name: "_rels/.rels", data: new TextEncoder().encode(RELS) },
    { name: "docProps/core.xml", data: new TextEncoder().encode(CORE_PROPS) },
    { name: "docProps/app.xml", data: new TextEncoder().encode(APP_PROPS) },
    { name: "word/_rels/document.xml.rels", data: new TextEncoder().encode(DOCUMENT_RELS) },
    { name: "word/document.xml", data: new TextEncoder().encode(documentXml) },
  ]);
}

/* ------------------------------------------------------------------ */
/* OOXML reading                                                       */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Minimal XML reader                                                  */
/*                                                                     */
/* The browser has DOMParser, but the parser must also run under plain  */
/* Node (unit tests), so we read the tiny OOXML subset ourselves:      */
/* elements, attributes, text, entities, comments and CDATA.           */
/* ------------------------------------------------------------------ */

interface XmlNode {
  /** Qualified name as written, e.g. `w:body`. */
  name: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  /** Concatenated direct text content, with entities decoded. */
  text: string;
}

const XML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};

function decodeEntities(source: string): string {
  return source.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
    if (body.startsWith("#")) {
      const hex = body[1] === "x" || body[1] === "X";
      const code = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0x20 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return XML_ENTITIES[body] ?? match;
  });
}

const isSpace = (ch: string) => ch === " " || ch === "\t" || ch === "\n" || ch === "\r";

/** Parse an XML document into a tree. Returns a synthetic root on failure. */
function parseXml(source: string): XmlNode {
  const root: XmlNode = { name: "#document", attrs: {}, children: [], text: "" };
  const stack: XmlNode[] = [root];
  const current = () => stack[stack.length - 1];
  let i = 0;
  const len = source.length;

  while (i < len) {
    const lt = source.indexOf("<", i);
    if (lt === -1) {
      current().text += decodeEntities(source.slice(i));
      break;
    }
    if (lt > i) current().text += decodeEntities(source.slice(i, lt));
    i = lt;

    // Comments, CDATA, doctype and processing instructions carry no
    // document content we care about.
    if (source.startsWith("<!--", i)) {
      const end = source.indexOf("-->", i + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }
    if (source.startsWith("<![CDATA[", i)) {
      const end = source.indexOf("]]>", i + 9);
      const stop = end === -1 ? len : end;
      current().text += source.slice(i + 9, stop);
      i = end === -1 ? len : end + 3;
      continue;
    }
    if (source.startsWith("<?", i)) {
      const end = source.indexOf("?>", i + 2);
      i = end === -1 ? len : end + 2;
      continue;
    }
    if (source.startsWith("<!", i)) {
      const end = source.indexOf(">", i + 2);
      i = end === -1 ? len : end + 1;
      continue;
    }

    // Closing tag.
    if (source[i + 1] === "/") {
      const end = source.indexOf(">", i);
      const name = source.slice(i + 2, end === -1 ? len : end).trim();
      // Unwind to the matching open tag, tolerating unbalanced markup.
      for (let d = stack.length - 1; d > 0; d--) {
        if (stack[d].name === name) {
          stack.length = d;
          break;
        }
      }
      i = end === -1 ? len : end + 1;
      continue;
    }

    // Opening tag: read the name, then its attributes.
    i++;
    const nameStart = i;
    while (i < len && !isSpace(source[i]) && source[i] !== ">" && source[i] !== "/") i++;
    const node: XmlNode = {
      name: source.slice(nameStart, i),
      attrs: {},
      children: [],
      text: "",
    };
    while (i < len) {
      while (i < len && isSpace(source[i])) i++;
      if (i >= len) break;
      if (source[i] === ">") {
        i++;
        current().children.push(node);
        stack.push(node);
        break;
      }
      if (source[i] === "/" && source[i + 1] === ">") {
        i += 2;
        current().children.push(node);
        break;
      }
      if (source[i] === "/") {
        i++;
        continue;
      }
      const attrStart = i;
      while (i < len && source[i] !== "=" && !isSpace(source[i]) && source[i] !== ">" && source[i] !== "/") i++;
      const attr = source.slice(attrStart, i);
      while (i < len && isSpace(source[i])) i++;
      let value = "";
      if (source[i] === "=") {
        i++;
        while (i < len && isSpace(source[i])) i++;
        const quote = source[i];
        if (quote === '"' || quote === "'") {
          const end = source.indexOf(quote, i + 1);
          value = source.slice(i + 1, end === -1 ? len : end);
          i = end === -1 ? len : end + 1;
        } else {
          const start = i;
          while (i < len && !isSpace(source[i]) && source[i] !== ">" && source[i] !== "/") i++;
          value = source.slice(start, i);
        }
      }
      if (attr) node.attrs[attr] = decodeEntities(value);
    }
  }

  return root;
}

/**
 * Local part of a qualified name, lower-cased. OOXML prefixes most elements
 * (`w:p`) but relationship parts use a default namespace (`Relationship`), so
 * matching has to work both ways and ignore case.
 */
const localOf = (name: string): string => {
  const lower = name.toLowerCase();
  const colon = lower.indexOf(":");
  return colon === -1 ? lower : lower.slice(colon + 1);
};

/** Direct child with the given local name, ignoring the namespace prefix. */
const child = (el: XmlNode, local: string): XmlNode | null => {
  const want = localOf(local);
  for (const n of el.children) {
    if (localOf(n.name) === want) return n;
  }
  return null;
};

const children = (el: XmlNode, local: string): XmlNode[] => {
  const want = localOf(local);
  return el.children.filter((n) => localOf(n.name) === want);
};

/** Descendants with the given local name, in document order. */
const findAll = (node: XmlNode, local: string): XmlNode[] => {
  const want = localOf(local);
  const out: XmlNode[] = [];
  const walk = (n: XmlNode) => {
    for (const c of n.children) {
      if (localOf(c.name) === want) out.push(c);
      walk(c);
    }
  };
  walk(node);
  return out;
};

/* ------------------------------------------------------------------ */
/* OOXML document parsing                                              */
/* ------------------------------------------------------------------ */

/** Run properties -> opening inline tags, in a fixed nesting order. */
const runOpenTags = (r: XmlNode): string[] => {
  const rPr = child(r, "rPr");
  if (!rPr) return [];
  const attrs: string[] = [];
  const color = child(rPr, "color")?.attrs["w:val"];
  if (color && color !== "auto" && /^[0-9a-f]{6}$/i.test(color)) {
    attrs.push(`<span style="color:#${color}">`);
  }
  const sz = child(rPr, "sz")?.attrs["w:val"];
  if (sz && Number(sz) > 0) {
    attrs.push(`<span style="font-size:${Math.round(Number(sz) / 2)}pt">`);
  }
  if (child(rPr, "b")) attrs.push("<strong>");
  if (child(rPr, "i")) attrs.push("<em>");
  if (child(rPr, "strike")) attrs.push("<s>");
  if (child(rPr, "u")) attrs.push("<u>");
  const va = child(rPr, "vertAlign")?.attrs["w:val"];
  if (va === "subscript") attrs.push("<sub>");
  if (va === "superscript") attrs.push("<sup>");
  return attrs;
};

/** Closing tags for runOpenTags, in reverse nesting order. */
const runCloseTags = (r: XmlNode): string[] => {
  const closes: string[] = [];
  const rPr = child(r, "rPr");
  if (!rPr) return closes;
  const color = child(rPr, "color")?.attrs["w:val"];
  if (color && color !== "auto" && /^[0-9a-f]{6}$/i.test(color)) closes.push("</span>");
  const sz = child(rPr, "sz")?.attrs["w:val"];
  if (sz && Number(sz) > 0) closes.push("</span>");
  if (child(rPr, "b")) closes.push("</strong>");
  if (child(rPr, "i")) closes.push("</em>");
  if (child(rPr, "strike")) closes.push("</s>");
  if (child(rPr, "u")) closes.push("</u>");
  const va = child(rPr, "vertAlign")?.attrs["w:val"];
  if (va === "subscript") closes.push("</sub>");
  if (va === "superscript") closes.push("</sup>");
  return closes.reverse();
};

/** numId -> (ilvl -> numFmt) from word/numbering.xml. */
function parseNumbering(xml: string | null): Map<string, Map<string, string>> {
  const byNumId = new Map<string, Map<string, string>>();
  if (!xml) return byNumId;
  const root = parseXml(xml);
  const abstracts = new Map<string, Map<string, string>>();
  for (const n of findAll(root, "abstractNum")) {
    const levels = new Map<string, string>();
    for (const lvl of children(n, "lvl")) {
      levels.set(lvl.attrs["w:ilvl"] ?? "0", child(lvl, "numFmt")?.attrs["w:val"] ?? "decimal");
    }
    abstracts.set(n.attrs["w:abstractNumId"] ?? "", levels);
  }
  for (const n of findAll(root, "num")) {
    const abstractId = child(n, "abstractNumId")?.attrs["w:val"] ?? "";
    const levels = abstracts.get(abstractId);
    if (levels) byNumId.set(n.attrs["w:numId"] ?? "", levels);
  }
  return byNumId;
}

/** r:id -> target from word/_rels/document.xml.rels. */
function parseRelationships(xml: string | null): Map<string, string> {
  const map = new Map<string, string>();
  if (!xml) return map;
  const root = parseXml(xml);
  for (const n of findAll(root, "Relationship")) {
    const id = n.attrs["Id"];
    const target = n.attrs["Target"];
    if (id && target) map.set(id, target);
  }
  return map;
}

function parseDocxXml(
  xml: string,
  numbering: Map<string, Map<string, string>> = new Map(),
  rels: Map<string, string> = new Map(),
): string {
  const body = findAll(parseXml(xml), "body")[0] ?? null;
  if (!body) return "<p></p>";

  /** Inline content of a paragraph, honouring hyperlinks and run order. */
  const inlineText = (p: XmlNode): string => {
    let out = "";
    const walk = (node: XmlNode) => {
      for (const c of node.children) {
        const local = localOf(c.name);
        // Paragraph/run properties hold no text content.
        if (local === "ppr" || local === "rpr") continue;

        if (local === "hyperlink") {
          const rid = c.attrs["r:id"] ?? "";
          const anchor = c.attrs["w:anchor"];
          const href = rid ? rels.get(rid) : anchor ? `#${anchor}` : null;
          // Recurse into the hyperlink, then wrap just that slice of output.
          const before = out.length;
          walk(c);
          const inside = out.slice(before);
          out = out.slice(0, before);
          out += href ? `<a href="${esc(href)}">${inside}</a>` : inside;
          continue;
        }

        if (local === "r") {
          let text = "";
          for (const n of c.children) {
            const t = localOf(n.name);
            if (t === "t") text += n.text;
            else if (t === "tab") text += "\t";
            else if (t === "br") text += "\n";
            else if (t === "nobreakhyphen") text += "-";
          }
          if (text) out += runOpenTags(c).join("") + esc(text) + runCloseTags(c).join("");
          continue;
        }

        // smartTag / ins / sdt wrappers: recurse so their runs are not lost.
        walk(c);
      }
    };
    walk(p);
    return out;
  };

  const paragraphHtml = (p: XmlNode): string => {
    const pPr = child(p, "pPr");
    const styleVal = pPr ? (child(pPr, "pStyle")?.attrs["w:val"] ?? "") : "";
    const level = /Heading(\d)/.exec(styleVal)?.[1];
    const text = inlineText(p);
    if (level) return `<h${level}>${text}</h${level}>`;
    const style: string[] = [];
    const jc = pPr ? child(pPr, "jc")?.attrs["w:val"] : null;
    const align = jc === "both" ? "justify" : jc ?? "";
    if (["left", "center", "right", "justify"].includes(align)) {
      style.push(`text-align:${align}`);
    }
    const ind = pPr ? child(pPr, "ind") : null;
    const left = ind?.attrs["w:left"] ?? ind?.attrs["w:start"] ?? "";
    if (left && Number(left) > 0) style.push(`margin-left:${Math.round(Number(left) / 20)}pt`);
    const firstLine = ind?.attrs["w:firstLine"] ?? "";
    if (firstLine && Number(firstLine) > 0) {
      style.push(`text-indent:${Math.round(Number(firstLine) / 20)}pt`);
    }
    return style.length ? `<p style="${style.join(";")}">${text}</p>` : `<p>${text}</p>`;
  };

  /** ul/ol for a paragraph carrying w:numPr, or null when it is not a list item. */
  const listKind = (p: XmlNode): "ul" | "ol" | null => {
    const pPr = child(p, "pPr");
    const numPr = pPr ? child(pPr, "numPr") : null;
    if (!numPr) return null;
    const numId = child(numPr, "numId")?.attrs["w:val"];
    if (!numId || numId === "0") return null;
    const ilvl = child(numPr, "ilvl")?.attrs["w:val"] ?? "0";
    const levels = numbering.get(numId);
    const fmt = levels?.get(ilvl) ?? levels?.get("0");
    if (!fmt) return null;
    return fmt === "bullet" ? "ul" : "ol";
  };

  const tableHtml = (tbl: XmlNode): string => {
    const rows = children(tbl, "tr").map((tr) => {
      const cells = children(tr, "tc").map((tc) => {
        const inner = children(tc, "p")
          .map((p) => `<p>${inlineText(p)}</p>`)
          .join("");
        return `<td>${inner || "<p></p>"}</td>`;
      });
      return `<tr>${cells.join("")}</tr>`;
    });
    return `<table><tbody>${rows.join("")}</tbody></table>`;
  };

  const html: string[] = [];

  /** Emit blocks, grouping consecutive list items into one wrapper. */
  const emit = (nodes: XmlNode[]) => {
    let open: "ul" | "ol" | null = null;
    let buffer: string[] = [];

    const closeList = () => {
      if (!open) return;
      html.push(`<${open}><li>${buffer.join("</li><li>")}</li></${open}>`);
      open = null;
      buffer = [];
    };

    for (const n of nodes) {
      const local = localOf(n.name);
      // Structured document tags wrap real content in w:sdtContent.
      if (local === "sdt") {
        closeList();
        const content = child(n, "sdtContent");
        if (content) emit(content.children);
        continue;
      }
      if (local === "tbl") {
        closeList();
        html.push(tableHtml(n));
        continue;
      }
      if (local !== "p") continue;

      const kind = listKind(n);
      if (kind) {
        if (open !== kind) {
          closeList();
          open = kind;
        }
        buffer.push(paragraphHtml(n));
        continue;
      }
      closeList();
      html.push(paragraphHtml(n));
    }
    closeList();
  };

  emit(body.children);
  return html.join("");
}

/**
 * Convert a .docx binary back to HTML for the editor. Returns null when the
 * file uses features we can't read (e.g. deflate-compressed entries).
 */
export function parseDocx(data: Uint8Array): string | null {
  const documentXml = zipRead(data, "word/document.xml");
  if (!documentXml) return null;
  const dec = new TextDecoder();
  const numberingXml = zipRead(data, "word/numbering.xml");
  const relsXml = zipRead(data, "word/_rels/document.xml.rels");
  return parseDocxXml(
    dec.decode(documentXml),
    parseNumbering(numberingXml ? dec.decode(numberingXml) : null),
    parseRelationships(relsXml ? dec.decode(relsXml) : null),
  );
}
