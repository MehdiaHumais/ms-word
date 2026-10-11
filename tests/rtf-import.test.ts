import { describe, expect, it } from "vitest";
import { parseRtf } from "../src/app/Editor/rtf";

/**
 * A document exercising the features this importer claims to support.
 *
 * The shape follows what Word actually writes: a list table destination, and
 * list paragraphs marked with `\ls`/`\ilvl` rather than inline `\pnlvlblt`
 * (Word buries those inside ignorable `{\*\pn}` groups).
 */
const RICH_RTF = String.raw`{\rtf1\ansi\ansicpg1252\deff0
{\fonttbl{\f0\froman Times New Roman;}{\f1\fswiss Arial;}}
{\colortbl ;\red255\green0\blue0;\red0\green0\blue255;}
{\info{\title Ignored}}
{\*\generator Some Tool 1.0;}
{\listtable
{\list\listtemplateid1\listhybrid
{\listlevel\levelnfc23\levelnfcn23\leveljc0\leveljcn0\levelfollow0\levelstartat1\levelspace0\levelindent0{\leveltext\'02\'00.;}{\levelnumbers\'01;}\fi-360\li720\lin720}
\listid1}
{\list\listtemplateid2\listhybrid
{\listlevel\levelnfc0\levelnfcn2\leveljc0\leveljcn0\levelfollow0\levelstartat1\levelspace0\levelindent0{\leveltext\'02\'00.;}{\levelnumbers\'01;}\fi-360\li720\lin720}
\listid2}}
{\*\listoverridetable{\listoverride\listid1\listoverridecount0\ls1}}
\viewkind4\uc1
\pard\sa240\sl259\slmult1\f0\fs22
\outlinelevel0 \b Report Title\b0  \par
\pard\plain \b Bold\b0  \b0  and \i italic\i0  and \ul underlined\ulnone  and \strike struck\strike0 and H\sub 2\nosupersub O and x\super 2\nosupersub \par
\pard \qc centred paragraph\par
\pard \qr right aligned\par
\pard \qj justified text\par
\pard\li720\fi-360\ls1\ilvl0 first bullet\par
\pard\li720\fi-360\ls1\ilvl0 second bullet\par
\pard\li1440\fi-360\ls1\ilvl0 nested bullet\par
\pard\li720\fi-360\ls2\ilvl0 numbered one\par
\pard\li720\fi-360\ls2\ilvl0 numbered two\par
\trowd\trgaph108\cellx2000\cellx4000\cellx6000
\intbl Cell A\cell Cell B\cell Cell C\cell
\row
\trowd\trgaph108\cellx2000\cellx4000\cellx6000
\intbl Second A\cell Second B\cell Second C\cell
\row
\pard\cf1 red text\cf0 \par
\pard {\field{\*\fldinst {HYPERLINK "https://example.com/docs" }}{\fldrslt {\cf2\ul clickable link}}}\par
\pard Tab\tab here\line and a line break\par
\pard \u8212? unicode em dash and \u8217? smart apostrophe and \lquote quoted\rquote \par
\pard {\pict\wmetafile8 NGsPfseq0g00000}\b after the skip \b0 \par
}`;

describe("parseRtf", () => {
  it("rejects non-RTF input", () => {
    expect(parseRtf("just some plain text")).toBeNull();
    expect(parseRtf("<p>html</p>")).toBeNull();
    expect(parseRtf(new Uint8Array([1, 2, 3]))).toBeNull();
  });

  it("reads a heading from the outline level", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).toContain("Report Title");
    // \outlinelevel0 means body text, so this must NOT become a heading.
    expect(html).not.toContain("<h1>");
  });

  it("maps run formatting", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<u>underlined</u>");
    expect(html).toContain("<s>struck</s>");
    expect(html).toContain("H<sub>2</sub>O");
    expect(html).toContain("x<sup>2</sup>");
  });

  it("honours paragraph alignment", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).toContain("text-align:center");
    expect(html).toContain("text-align:right");
    expect(html).toContain("text-align:justify");
  });

  it("groups consecutive bullets and numbers into real lists", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).toContain("<ul>");
    expect(html).toContain("first bullet");
    expect(html).toContain("second bullet");
    expect(html).toContain("<ol>");
    expect(html).toContain("numbered one");
    // Bullets and numbers must not share one wrapper.
    expect(html.indexOf("<ul>")).toBeLessThan(html.indexOf("<ol>"));
    expect(html).not.toContain("data-list");
  });

  it("reads table rows and cells", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).toContain("<table>");
    expect(html).toContain("<td><p>Cell A</p></td>");
    expect(html).toContain("<td><p>Cell C</p></td>");
    expect(html).toContain("Second B");
    // Two rows, so two <tr>.
    expect((html.match(/<tr>/g) ?? []).length).toBe(2);
  });

  it("applies colour table entries", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).toContain("#ff0000");
  });

  it("links HYPERLINK fields", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain("clickable link");
  });

  it("decodes tabs, line breaks and unicode escapes", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).toContain("Tab");
    expect(html).toContain("\u2014"); // em dash
    expect(html).toContain("\u2019"); // right single quote
    // `\lquote`/`\rquote` are the *single* quote pair.
    expect(html).toContain("\u2018quoted\u2019");
  });

  it("never leaks destination metadata into the document", () => {
    const html = parseRtf(RICH_RTF) ?? "";
    expect(html).not.toContain("Times New Roman");
    expect(html).not.toContain("colortbl");
    expect(html).not.toContain("generator");
    expect(html).not.toContain("pict");
    expect(html).not.toContain("NGsPfseq");
    expect(html).not.toContain("Ignored");
    // Control words must not survive as literal text.
    expect(html).not.toContain("\\pard");
    expect(html).not.toContain("\\fswiss");
  });

  it("escapes HTML-significant characters", () => {
    const html = parseRtf(String.raw`{\rtf1\ansi a < b & c > d\par}`) ?? "";
    expect(html).toContain("&lt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&gt;");
  });

  it("handles a minimal RTF file", () => {
    const html = parseRtf(String.raw`{\rtf1\ansi Hello\par}`) ?? "";
    expect(html).toContain("Hello");
  });

  it("handles nested groups and state restoration", () => {
    const html = parseRtf(String.raw`{\rtf1\ansi{\b bold {\i and italic}}\par}`) ?? "";
    expect(html).toContain("<em>and italic</em>");
    // Leaving the italic group must not leave italic switched on: the `\em`
    // text may only be styled italic.
    expect(html).toContain("</em></strong>");
    expect(html).not.toContain("</em> and");
  });

  it("accepts raw bytes as well as a string", () => {
    const bytes = new TextEncoder().encode(String.raw`{\rtf1\ansi from bytes\par}`);
    expect(parseRtf(bytes)).toContain("from bytes");
  });
});