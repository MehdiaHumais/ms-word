import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node } from "@tiptap/pm/model";
import { isDictionaryWord, isIgnoredWord } from "../../Shell/reviewLib";

export interface Misspell {
  word: string;
  from: number;
  to: number;
}

function acceptableContraction(w: string): boolean {
  const parts = w.toLowerCase().split(/['’]/);
  if (parts.length > 1) {
    const base = parts[0];
    if (base && isDictionaryWord(base)) return true;
    const last = parts[parts.length - 1];
    if (["t", "s", "re", "ve", "ll", "d", "m"].includes(last)) return true;
  }
  return false;
}

const WORD_RE = /[A-Za-zÀ-ÿ]+(?:['’][A-Za-zÀ-ÿ]+)*/g;

export function computeMisspellings(doc: Node): Misspell[] {
  const out: Misspell[] = [];
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text;
      let m: RegExpExecArray | null;
      WORD_RE.lastIndex = 0;
      while ((m = WORD_RE.exec(text))) {
        const word = m[0];
        if (word.length < 3) continue;
        if (/^[A-Z]/.test(word) && word.length <= 3) continue;
        if (!isDictionaryWord(word) && !acceptableContraction(word) && !isIgnoredWord(word)) {
          out.push({ word, from: pos + m.index, to: pos + m.index + word.length });
        }
      }
    }
    return true;
  });
  return out;
}

export const spellKey = new PluginKey<number>("britSpell");

const spellPlugin = (): Plugin => {
  return new Plugin<number>({
    key: spellKey,
    state: {
      init: () => 0,
      apply(tr, version) {
        return tr.docChanged ? (version ?? 0) + 1 : version;
      },
    },
    props: {
      decorations(state) {
        const misses = computeMisspellings(state.doc);
        if (misses.length === 0) return null;
        const decos = misses.map((m) =>
          Decoration.inline(m.from, m.to, { class: "brit-spell-error" }),
        );
        return DecorationSet.create(state.doc, decos);
      },
    },
  });
};

export const SpellCheck = Extension.create({
  name: "spellCheck",
  addProseMirrorPlugins() {
    return [spellPlugin()];
  },
});