import { describe, expect, it } from "vitest";
import { parseDocx, zipStore } from "../src/app/Editor/docx";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const dec = new TextEncoder();

function doc(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}<w:sectPr/></w:body></w:document>`;
}

/** Build an in-memory .docx with the given parts. */
function makeDocx(files: Record<string, string>): Uint8Array {
  return zipStore(
    Object.entries(files).map(([name, content]) => ({
      name,
      data: dec.encode(content),
    })),
  );
}

const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="${W}">
  <w:abstractNum w:abstractNumId="0">
    <w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl>
  </w:abstractNum>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId9" Target="https://example.com/docs" TargetMode="External"/>
</Relationships>`;

/** Paragraph carrying a numPr list reference. */
const listItem = (numId: number, text: string) =>
  `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr></w:pPr><w:r><w:t>${text}</w:t></w:r></w:p>`;

const cell = (text: string) => `<w:tc><w:tcPr/><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;

const TABLE =
  `<w:tbl><w:tblPr/>` +
  `<w:tr>${cell("Cell A")}${cell("Cell B")}${cell("Cell C")}</w:tr>` +
  `<w:tr>${cell("Second A")}${cell("Second B")}${cell("Second C")}</w:tr>` +
  `</w:tbl>`;

const only = (body: string) => parseDocx(makeDocx({ "word/document.xml": doc(body) })) ?? "";

const withExtras = (body: string) =>
  parseDocx(
    makeDocx({
      "word/document.xml": doc(body),
      "word/numbering.xml": NUMBERING,
      "word/_rels/document.xml.rels": RELS,
    }),
  ) ?? "";

describe("parseDocx", () => {
  it("returns null when the document part is missing or compressed", () => {
    expect(parseDocx(new Uint8Array([0, 1, 2, 3]))).toBeNull();
  });

  it("reads paragraphs and headings", () => {
    const html = only(
      `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Title</w:t></w:r></w:p>` +
        `<w:p><w:r><w:t>Body</w:t></w:r></w:p>`,
    );
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<p>Body</p>");
  });

  it("keeps runs in document order", () => {
    const html = only(
      `<w:p><w:r><w:t xml:space="preserve">one </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>two</w:t></w:r></w:p>`,
    );
    expect(html).toContain("<p>one <strong>two</strong></p>");
  });

  it("reads tables with every row and cell", () => {
    const html = only(TABLE);
    expect(html).toContain("<table>");
    expect((html.match(/<tr>/g) ?? []).length).toBe(2);
    expect((html.match(/<td>/g) ?? []).length).toBe(6);
    expect(html).toContain("<td><p>Cell A</p></td>");
    expect(html).toContain("<td><p>Second C</p></td>");
    // One table, not one per row.
    expect((html.match(/<table>/g) ?? []).length).toBe(1);
  });

  it("keeps a table in document order with surrounding paragraphs", () => {
    const html = only(`<w:p><w:r><w:t>before</w:t></w:r></w:p>` + TABLE + `<w:p><w:r><w:t>after</w:t></w:r></w:p>`);
    expect(html.indexOf("before")).toBeLessThan(html.indexOf("<table>"));
    expect(html.indexOf("<table>")).toBeLessThan(html.indexOf("after"));
  });

  it("groups bulleted paragraphs into a ul", () => {
    const html = withExtras(listItem(1, "first bullet") + listItem(1, "second bullet"));
    expect(html).toContain("<ul>");
    expect(html).toContain("first bullet");
    expect(html).toContain("second bullet");
    expect(html).not.toContain("<ol>");
  });

  it("groups numbered paragraphs into an ol", () => {
    const html = withExtras(listItem(2, "numbered one") + listItem(2, "numbered two"));
    expect(html).toContain("<ol>");
    expect((html.match(/<li>/g) ?? []).length).toBe(2);
    expect(html).not.toContain("<ul>");
  });

  it("keeps lists in document order", () => {
    const html = withExtras(
      `<w:p><w:r><w:t>intro</w:t></w:r></w:p>` +
        listItem(1, "bullet one") +
        listItem(2, "number one"),
    );
    expect(html.indexOf("intro")).toBeLessThan(html.indexOf("<ul>"));
    expect(html.indexOf("<ul>")).toBeLessThan(html.indexOf("<ol>"));
  });

  it("turns relationships into links", () => {
    const html = withExtras(
      `<w:p><w:hyperlink r:id="rId9"><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>clickable</w:t></w:r></w:hyperlink></w:p>`,
    );
    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain("clickable");
  });

  it("resolves internal anchors when there is no relationship", () => {
    const html = only(
      `<w:p><w:hyperlink w:anchor="Section1"><w:r><w:t>jump</w:t></w:r></w:hyperlink></w:p>`,
    );
    expect(html).toContain('href="#Section1"');
  });

  it("keeps link text outside the anchor when only partly linked", () => {
    const html = withExtras(
      `<w:p><w:r><w:t>see </w:t></w:r><w:hyperlink r:id="rId9"><w:r><w:t>here</w:t></w:r></w:hyperlink></w:p>`,
    );
    expect(html).toContain("<p>see <a href=\"https://example.com/docs\">here</a></p>");
  });

  it("reads run colour, size, strike, sub and superscript", () => {
    const html = only(
      `<w:p><w:r><w:rPr><w:color w:val="FF0000"/><w:sz w:val="28"/></w:rPr><w:t>red big</w:t></w:r></w:p>` +
        `<w:p><w:r><w:rPr><w:strike/></w:rPr><w:t>gone</w:t></w:r></w:p>` +
        `<w:p><w:r><w:rPr><w:vertAlign w:val="subscript"/></w:rPr><w:t>low</w:t></w:r></w:p>`,
    );
    expect(html).toContain("color:#FF0000");
    expect(html).toContain("font-size:14pt");
    expect(html).toContain("<s>gone</s>");
    expect(html).toContain("<sub>low</sub>");
  });

  it("honours paragraph alignment and indent", () => {
    const html = only(
      `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>mid</w:t></w:r></w:p>` +
        `<w:p><w:pPr><w:jc w:val="both"/></w:pPr><w:r><w:t>spread</w:t></w:r></w:p>` +
        `<w:p><w:pPr><w:ind w:left="720"/></w:pPr><w:r><w:t>indented</w:t></w:r></w:p>`,
    );
    expect(html).toContain("text-align:center");
    expect(html).toContain("text-align:justify");
    expect(html).toContain("margin-left:36pt");
  });

  it("decodes tabs and breaks", () => {
    const html = only(`<w:p><w:r><w:tab/><w:t>A</w:t><w:br/><w:t>B</w:t></w:r></w:p>`);
    expect(html).toContain("\t");
    expect(html).toContain("\n");
  });

  it("escapes HTML-significant text", () => {
    const html = only(`<w:p><w:r><w:t>a &lt; b &amp; c</w:t></w:r></w:p>`);
    expect(html).toBe("<p>a &lt; b &amp; c</p>");
    // Decoded from the XML entity, re-escaped for the editor: never raw.
    expect(html).not.toContain("a < b");
  });

  it("unwraps structured document tags", () => {
    const html = only(
      `<w:sdt><w:sdtPr/><w:sdtContent><w:p><w:r><w:t>inside sdt</w:t></w:r></w:p></w:sdtContent></w:sdt>`,
    );
    expect(html).toContain("<p>inside sdt</p>");
  });

  it("does not treat numId 0 as a list", () => {
    const html = withExtras(
      `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr></w:pPr><w:r><w:t>plain</w:t></w:r></w:p>`,
    );
    expect(html).toBe("<p>plain</p>");
  });
});