/**
 * BritDocs `.britdoc` envelope — create and parse versioned document files.
 *
 * File format (schema v1): { format, schemaVersion, appVersion, createdAt,
 * modifiedAt, meta, page, doc }  — see `docs/document-schema.md`.
 */
import {
  FORMAT,
  SCHEMA_VERSION,
} from "./types";
import type { BritDocument, DocNode, DocumentMeta, PageSetup } from "./types";
import { parseJson } from "./serialize";
import { validateEnvelopeDoc } from "./validate";

export interface CreateBritDocumentOptions {
  appVersion: string;
  title?: string;
  author?: string;
  language?: string;
  now?: string;
  page?: Partial<PageSetup>;
}

export function createBritDocument(
  doc: DocNode,
  options: CreateBritDocumentOptions,
): BritDocument {
  const now = options.now ?? new Date().toISOString();
  const meta: DocumentMeta = {
    title: options.title ?? "Untitled",
    author: options.author,
    language: options.language ?? "en-US",
    template: "default",
    thumbnail: null,
  };
  const page: PageSetup = {
    size: options.page?.size ?? "A4",
    orientation: options.page?.orientation ?? "portrait",
    margins: {
      top: options.page?.margins?.top ?? "72pt",
      right: options.page?.margins?.right ?? "72pt",
      bottom: options.page?.margins?.bottom ?? "72pt",
      left: options.page?.margins?.left ?? "72pt",
    },
    headerDistance: options.page?.headerDistance ?? "36pt",
    footerDistance: options.page?.footerDistance ?? "36pt",
  };
  return {
    format: FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion: options.appVersion,
    createdAt: now,
    modifiedAt: now,
    meta,
    page,
    doc,
  };
}

export interface ParseResult {
  ok: boolean;
  document?: BritDocument;
  errors: string[];
}

/** Parse + validate a `.britdoc` JSON string. Never throws. */
export function parseBritDocument(source: string): ParseResult {
  const raw = parseJson(source);
  if (raw === null) {
    return { ok: false, errors: ["not valid JSON"] };
  }
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, errors: ["envelope must be a JSON object"] };
  }
  const env = raw as Record<string, unknown>;

  if (env.format !== FORMAT) {
    return { ok: false, errors: [`format must be "${FORMAT}"`] };
  }
  if (env.schemaVersion !== SCHEMA_VERSION) {
    return {
      ok: false,
      errors: [
        `unsupported schemaVersion ${JSON.stringify(env.schemaVersion)} (expected ${SCHEMA_VERSION})`,
      ],
    };
  }
  if (typeof env.appVersion !== "string") {
    return { ok: false, errors: ["appVersion must be a string"] };
  }
  const doc = env.doc;
  const issues = validateEnvelopeDoc(doc as DocNode);
  if (issues.length > 0) {
    return {
      ok: false,
      errors: issues.map((i) => `${i.path}: ${i.message}`),
    };
  }
  return { ok: true, document: raw as unknown as BritDocument, errors: [] };
}

/** Update `modifiedAt` and touch `meta.title`. Immutable-friendly helper. */
export function touchBritDocument(
  document: BritDocument,
  now: string = new Date().toISOString(),
): BritDocument {
  return { ...document, modifiedAt: now };
}