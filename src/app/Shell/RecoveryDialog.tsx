import { useState } from "react";
import { loadEditorContent, useEditorContext } from "../Editor/EditorContext";
import { useAppStore } from "../../stores/appStore";
import { Modal } from "./tabKit";
import {
  clearDraft,
  draftKey,
  listDrafts,
  writeDraft,
  type Draft,
} from "../../domain/persistence/recovery";

function timeLabel(t: number): string {
  const d = new Date(t);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Crash recovery (V1 scope): after a reload, offer every leftover autosave
 * draft. Restoring opens the draft in its own tab (adopting the draft slot so
 * future edits keep autosaving); closing leaves any remaining drafts for the
 * next session, Word-style.
 */
export function RecoveryDialog() {
  const editor = useEditorContext();
  const [drafts, setDrafts] = useState<Draft[]>(() => listDrafts());
  const [dismissed, setDismissed] = useState(false);

  if (drafts.length === 0 || dismissed) return null;

  const restore = (d: Draft) => {
    const id = crypto.randomUUID();
    clearDraft(d.key);
    writeDraft(draftKey(id), { title: d.title, html: d.html, updatedAt: Date.now() });
    useAppStore.getState().openDocument({ id, title: d.title, path: null, dirty: true });
    useAppStore.getState().setActive(id);
    loadEditorContent(editor, d.html, { focus: false });
    setDrafts((prev) => prev.filter((x) => x.key !== d.key));
  };

  const discard = (key: string) => {
    clearDraft(key);
    setDrafts((prev) => prev.filter((x) => x.key !== key));
  };

  return (
    <Modal title="Document Recovery" onClose={() => setDismissed(true)} testid="recovery-dialog">
      <p className="mb-3 text-[12px] text-[#5a5a5a]">
        BritDocs closed unexpectedly and found unsaved drafts. Restore a draft to
        open it in a new tab, or discard it. Any drafts you leave will be offered
        again next time.
      </p>
      <div className="space-y-2">
        {drafts.map((d) => (
          <div
            key={d.key}
            className="flex items-center gap-3 rounded border border-[#e3e3e3] bg-[#fafafa] px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-[#1b1b1b]">{d.title}</div>
              <div className="text-[11px] text-[#8a8a8a]">Draft from {timeLabel(d.updatedAt)}</div>
            </div>
            <button
              data-testid={`recover-${d.key}`}
              onClick={() => restore(d)}
              className="cursor-pointer rounded bg-[#0078d4] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#005ba1]"
            >
              Restore
            </button>
            <button
              data-testid="recovery-discard"
              onClick={() => discard(d.key)}
              className="cursor-pointer rounded border border-[#d0d0d0] px-3 py-1 text-[12px] text-[#555] hover:bg-[#efefef]"
            >
              Discard
            </button>
          </div>
        ))}
      </div>
      {drafts.length > 1 && (
        <div className="mt-3 border-t border-[#eee] pt-3 text-right">
          <button
            data-testid="recovery-discard-all"
            onClick={() => {
              drafts.forEach((d) => clearDraft(d.key));
              setDrafts([]);
            }}
            className="cursor-pointer rounded border border-[#d9798a] px-3 py-1 text-[12px] text-[#8a1f1f] hover:bg-[#fde2e6]"
          >
            Discard all drafts
          </button>
        </div>
      )}
    </Modal>
  );
}