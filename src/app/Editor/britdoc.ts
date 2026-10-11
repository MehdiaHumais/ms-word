/**
 * `.britdoc` glue — converts the live editor + page settings into the native
 * BritDocs envelope (see `docs/document-schema.md`) and back. This is the V1
 * primary persistence path (Success Criterion 1: save → open round-trip).
 */
import type { Editor } from "@tiptap/core";
import {
  canonicalize,
  createBritDocument,
  parseBritDocument,
  type DocNode,
} from "../../domain/document-model";
import type {
  PageMargins,
  PageOrientation,
  PageSizeId,
} from "../../stores/appStore";
import { PAGE_SIZES } from "../../stores/appStore";

export const BRITDOC_MIME = "application/json";
export const BRITDOC_EXT = ".britdoc";

interface BritdocPage {
  size: PageSizeId;
  orientation: PageOrientation;
  margins: PageMargins;
}

/** inches → points, rounded, as the envelope's string format ("72pt"). */
function inchesToPt(inches: number): string {
  return `${Math.round(inches * 72)}pt`;
}

function pageSizeValue(id: PageSizeId): "A4" | "Letter" {
  return id === "letter" ? "Letter" : "A4";
}

/** Serialize editor content + page setup into a canonical .britdoc string. */
export function exportBritdoc(
  editor: Editor,
  page: BritdocPage,
  options: { title?: string; language?: string; now?: string } = {},
): string {
  const doc = editor.getJSON() as DocNode;
  const envelope = createBritDocument(doc, {
    appVersion: "0.1.0",
    title: options.title ?? "Untitled",
    language: options.language ?? "en-US",
    now: options.now,
    page: {
      size: pageSizeValue(page.size),
      orientation: page.orientation,
      margins: {
        top: inchesToPt(page.margins.top),
        right: inchesToPt(page.margins.right),
        bottom: inchesToPt(page.margins.bottom),
        left: inchesToPt(page.margins.left),
      },
    },
  });
  return canonicalize(envelope);
}

export interface ImportBritdocSuccess {
  ok: true;
  fileName: string;
  title: string;
  json: string;
  page: BritdocPage;
}

export interface ImportBritdocFailure {
  ok: false;
  errors: string[];
}

export type ImportBritdocResult = ImportBritdocSuccess | ImportBritdocFailure;

/** Parse + validate a `.britdoc` string. Returns data needed to reopen the file. */
export function importBritdoc(
  source: string,
  fileName: string,
): ImportBritdocResult {
  const parsed = parseBritDocument(source);
  if (!parsed.ok || !parsed.document) {
    return { ok: false, errors: parsed.errors };
  }
  const env = parsed.document;
  const size = Object.entries(PAGE_SIZES).find(
    ([, v]) => v.label === env.page.size,
  )?.[0] as PageSizeId | undefined;
  return {
    ok: true,
    fileName,
    title: env.meta.title || fileName.replace(/\.[^/.]+$/, ""),
    json: canonicalize(env.doc),
    page: {
      size: size ?? "a4",
      orientation: env.page.orientation === "landscape" ? "landscape" : "portrait",
      margins: {
        top: ptToInches(env.page.margins.top),
        right: ptToInches(env.page.margins.right),
        bottom: ptToInches(env.page.margins.bottom),
        left: ptToInches(env.page.margins.left),
      },
    },
  };
}

function ptToInches(value: string | undefined): number {
  const n = parseFloat(value ?? "");
  if (Number.isFinite(n) && n > 0) return Math.round((n / 72) * 100) / 100;
  return 1;
}