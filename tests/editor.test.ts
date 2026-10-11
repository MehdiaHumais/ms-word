import { describe, expect, it } from "vitest";
import { createEditorExtensions } from "../src/app/Editor/editorConfig";

/**
 * Editor-engine integrity tests (no DOM required — we inspect the extension
 * list rather than instantiating an editor). Full browser E2E smoke tests are
 * scheduled with the Phase 16 QA suite.
 */
describe("editor engine — extension integrity", () => {
  it("does not re-register Link/Underline outside StarterKit (regression: duplicate-name warning)", () => {
    const names = createEditorExtensions().map((e) => e.name);
    expect(names).toContain("starterKit");
    expect(names.filter((n) => n === "link").length).toBe(0);
    expect(names.filter((n) => n === "underline").length).toBe(0);
  });

  it("registers internal-only extensions exactly once", () => {
    const names = createEditorExtensions().map((e) => e.name);
    expect(names.filter((n) => n === "characterCount").length).toBe(1);
    expect(names.filter((n) => n === "textAlign").length).toBe(1);
    expect(names.filter((n) => n === "highlight").length).toBe(1);
    expect(names.filter((n) => n === "pageBreak").length).toBe(1);
    expect(names.filter((n) => n === "lineHeight").length).toBe(1);
    expect(names.filter((n) => n === "fontSize").length).toBe(1);
  });
});