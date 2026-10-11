import { readFileSync } from "node:fs";

const file = process.argv[2];
const data = readFileSync(file);
const txt = data.toString("latin1");

const problems = [];
if (!txt.startsWith("%PDF-1.4")) problems.push("bad header");
if (!txt.includes("%\u00e2\u00e3\u00cf\u00d3")) problems.push("missing binary comment");
if (!/%EOF[\r\n]+$/.test(txt)) problems.push("missing %%EOF at end");

/* validate xref via startxref */
const sxm = /startxref\s+(\d+)/.exec(txt);
if (!sxm) problems.push("no startxref");
else {
  const sx = Number(sxm[1]);
  const head = txt.slice(sx, sx + 12);
  if (!head.startsWith("xref")) problems.push("startxref does not point at xref");
  else {
    const m = /xref\n0 (\d+)\n/.exec(txt.slice(sx));
    const entryCount = m ? Number(m[1]) : 0;
    const sects = txt.slice(sx).split("trailer")[0].split("xref\n")[1];
    const lines = sects.trim().split("\n");
    let entryIdx = 0;
    let okObjs = 0;
    let failObjs = 0;
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 3 && /^[nf]$/i.test(parts[2])) {
        if (/^n$/i.test(parts[2])) {
          const eoff = Number(parts[0]);
          const want = `${entryIdx} 0 obj`;
          const got = txt.slice(eoff, eoff + want.length);
          if (eoff > 0 && got === want) okObjs++;
          else { failObjs++; if (failObjs <= 12) console.log(`  bad offset entry #${entryIdx}: offset=${eoff} got '${got}'`); }
        }
        entryIdx++;
      }
    }
    if (entryCount > 0 && okObjs !== entryCount - 1) {
      problems.push(`xref object mismatch: expected ${entryCount - 1} valid, found ${okObjs}${failObjs ? ` (${failObjs} bad)` : ""}`);
    }
    console.log(`xref entries=${entryCount} objects pointing correctly=${okObjs}/${entryCount - 1}`);
  }
}

/* check expected content is inside a content stream (cp1252 bytes) */
const expect = process.argv[3];
if (expect) {
  const b = Buffer.from(expect, "latin1");
  if (!data.includes(b)) problems.push(`text '${expect}' not found in PDF bytes`);
  else console.log(`content text present: '${expect}'`);
}

/* count pages */
const pages = (txt.match(/\/Type \/Page[^s]/g) || []).length;
console.log(`page objects: ${pages}`);

console.log("PDF SIZE:", data.length);
console.log(problems.length ? "\nVERDICT: BAD — " + problems.join("; ") : "\nVERDICT: PDF VALID");