/**
 * Canonical serialization for the BritDocs document model.
 *
 * `JSON.stringify` preserves object key insertion order, which is
 * implementation-dependent. `canonicalize` sorts keys lexicographically so a
 * document serialized twice is always byte-identical regardless of how the
 * object was constructed — this is what the round-trip tests rely on.
 */

export function canonicalize(value: unknown): string {
  return JSON.stringify(sort(value), null, 2);
}

function sort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sort);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      result[key] = sort((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

/** Parse + structural coarse-check (key order independent). Returns null on bad input. */
export function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}