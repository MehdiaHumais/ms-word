import { describe, expect, it } from "vitest";
import {
  THEMES,
  DEFAULT_THEME_ID,
  getTheme,
  parseHex,
  darken,
  themeVars,
} from "../src/stores/themes";

describe("themes", () => {
  it("ships at least five themes, each with six accents and two fonts", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(5);
    for (const t of THEMES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.colors).toHaveLength(6);
      for (const c of t.colors) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.headingFont).toBeTruthy();
      expect(t.bodyFont).toBeTruthy();
    }
  });

  it("has unique ids and a default that exists", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(DEFAULT_THEME_ID);
  });

  it("getTheme falls back to the default for unknown ids", () => {
    expect(getTheme("gallery").id).toBe("gallery");
    expect(getTheme("does-not-exist").id).toBe(DEFAULT_THEME_ID);
    expect(getTheme("").id).toBe(DEFAULT_THEME_ID);
  });

  it("parseHex handles 3- and 6-digit hex and rejects junk", () => {
    expect(parseHex("#ffffff")).toEqual([255, 255, 255]);
    expect(parseHex("#000000")).toEqual([0, 0, 0]);
    expect(parseHex("#4472c4")).toEqual([0x44, 0x72, 0xc4]);
    expect(parseHex("#f00")).toEqual([255, 0, 0]);
    expect(parseHex("nonsense")).toEqual([0, 0, 0]);
  });

  it("darken reduces each channel and clamps the amount", () => {
    expect(darken("#ffffff", 0)).toBe("#ffffff");
    expect(darken("#ffffff", 1)).toBe("#000000");
    expect(darken("#ffffff", 0.5)).toBe("#808080");
    expect(darken("#ffffff", 2)).toBe("#000000");
    expect(darken("#ffffff", -1)).toBe("#ffffff");
  });

  it("themeVars exposes the four document style variables", () => {
    const office = getTheme("office");
    const vars = themeVars(office) as Record<string, string>;
    expect(vars["--brit-body-font"]).toContain("Calibri");
    expect(vars["--brit-heading-font"]).toContain("Calibri Light");
    expect(vars["--brit-link-color"]).toBe(office.colors[0]);
    expect(vars["--brit-heading-color"]).toBe(darken(office.colors[0], 0.4));
  });

  it("different themes produce different style variables", () => {
    const a = themeVars(getTheme("office")) as Record<string, string>;
    const b = themeVars(getTheme("gallery")) as Record<string, string>;
    expect(a["--brit-heading-color"]).not.toBe(b["--brit-heading-color"]);
    expect(a["--brit-body-font"]).not.toBe(b["--brit-body-font"]);
  });
});
