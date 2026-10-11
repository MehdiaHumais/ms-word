import { useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import {
  useMailStore,
  MERGE_MASTER_FIELDS,
  collectMergeFields,
  substituteFields,
  addressBlockFor,
  type Recipient,
} from "../../stores/mailStore";
import { Group, RvCell, Popover, MenuSection, MenuItem, Modal } from "./tabKit";
import {
  IconEnvelope,
  IconLabels,
  IconMailMerge,
  IconRecipients,
  IconAddressBlock,
  IconGreetingLine,
  IconMergeField,
  IconHighlightFields,
  IconPreviewResults,
  IconFirstRecord,
  IconLastRecord,
  IconCheckErrors,
  IconFinishMerge,
} from "./icons";

export function MailingsTab() {
  const editor = useEditorContext();
  const recipients = useMailStore((s) => s.recipients);
  const currentIdx = useMailStore((s) => s.currentIdx);
  const preview = useMailStore((s) => s.preview);
  const highlightFields = useMailStore((s) => s.highlightFields);
  const docType = useMailStore((s) => s.docType);

  const [menu, setMenu] = useState<null | string>(null);
  const [showRecipients, setShowRecipients] = useState(false);
  const [showCheckErrors, setShowCheckErrors] = useState(false);
  const [mergeDone, setMergeDone] = useState(false);

  const fields = editor ? collectMergeFields(editor.getText()) : [];
  const current = recipients[currentIdx];
  const hasDoc = !!editor;

  const go = (delta: number) => {
    const next = currentIdx + delta;
    useMailStore.getState().setCurrentIdx(next);
  };

  const togglePreview = () => useMailStore.getState().setPreview(!preview);

  const applyMergeToDoc = () => {
    if (!editor || !current) return;
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch, state }) => {
        let changed = false;
        type Block = { pos: number; size: number }[];
        const blocks: Block = [];
        tr.doc.descendants((n, pos) => {
          if (n.isTextblock) blocks.push({ pos, size: n.nodeSize });
          return true;
        });
        const schema = tr.doc.type.schema;
        for (const b of blocks) {
          const from = b.pos + 1;
          const to = b.pos + b.size - 1;
          const raw = tr.doc.textBetween(from, to, "\n", " ");
          if (!/«[^»]+»/.test(raw)) continue;
          const sub = substituteFields(raw, current);
          tr.replaceWith(from, to, sub ? [schema.text(sub)] : []);
          changed = true;
        }
        if (!changed) {
          const raw = tr.doc.textBetween(0, tr.doc.content.size, "\n", " ");
          if (/«[^»]+»/.test(raw)) {
            const sub = substituteFields(raw, current);
            tr.insertText(sub);
            changed = true;
          }
        }
        dispatch?.(tr);
        void state;
        return changed;
      })
      .run();
  };

  const addressOk = !!current && addressBlockFor(current).trim() !== "";
  const greetOk = !!current;

  return (
    <div className="flex h-[104px] items-stretch px-1" data-testid="mailings-tab">
      {/* Create */}
      <Group title="Create">
        <button
          data-testid="btnEnvelopes"
          onClick={() => setMenu(menu === "envelopes" ? null : "envelopes")}
          className="flex h-[44px] w-[74px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
        >
          <IconEnvelope />
          <span className="text-center text-[7.5px] leading-[8px] text-[#444]">Envelopes</span>
        </button>
        <button
          data-testid="btnLabels"
          onClick={() => setMenu(menu === "labels" ? null : "labels")}
          className="flex h-[32px] w-[74px] cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
        >
          <IconLabels />
          <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">Labels</span>
        </button>
        <Popover open={menu === "envelopes" || menu === "labels"} onClose={() => setMenu(null)} align="left-0">
          <MenuSection title="Create" />
          <MenuItem
            onClick={() => {
              editor?.chain().focus().insertContent({ type: "paragraph", content: [{ type: "text", text: "Envelope — Recipient:" }] }).run();
              setMenu(null);
            }}
          >
            Create Envelope
            <span className="text-[9px] text-[#8a8a8a]">Adds an envelope shell</span>
          </MenuItem>
          <MenuItem
            onClick={() => {
              editor?.chain().focus().insertContent({ type: "paragraph", content: [{ type: "text", text: "Labels template" }] }).run();
              setMenu(null);
            }}
          >
            Create Labels
          </MenuItem>
        </Popover>
      </Group>

      {/* Start Mail Merge */}
      <Group title="Start Mail Merge">
        <RvCell
          title="Start Mail Merge"
          icon={<IconMailMerge />}
          testid="btnStartMerge"
          active={menu === "start"}
          onClick={() => setMenu(menu === "start" ? null : "start")}
        />
        <RvCell
          title="Select Recipients"
          icon={<IconRecipients />}
          testid="btnSelectRecipients"
          badge={recipients.length}
          onClick={() => {
            setMenu(null);
            setShowRecipients(true);
          }}
        />
        <Popover open={menu === "start"} onClose={() => setMenu(null)} align="left-0">
          <MenuSection title="Start Mail Merge" />
          {["letters", "email", "envelopes", "labels", "directory"].map((t) => (
            <MenuItem
              key={t}
              active={docType === t}
              onClick={() => useMailStore.getState().setDocType(t as typeof docType)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </MenuItem>
          ))}
        </Popover>
      </Group>

      {/* Write & Insert Fields */}
      <Group title="Write & Insert Fields" widthClass="w-[150px]">
        <RvCell
          title="Address Block"
          icon={<IconAddressBlock />}
          testid="btnAddressBlock"
          disabled={!addressOk}
          onClick={() => {
            if (editor && current) {
              editor.chain().focus().insertContent(`«AddressBlock:${current.id}»`).run();
            }
            setMenu(null);
          }}
        />
        <RvCell
          title="Greeting Line"
          icon={<IconGreetingLine />}
          testid="btnGreetingLine"
          disabled={!greetOk}
          onClick={() => {
            if (editor && current) {
              editor.chain().focus().insertContent(`«GreetingLine:${current.id}»`).run();
            }
            setMenu(null);
          }}
        />
        <button
          data-testid="btnInsertMergeField"
          aria-pressed={menu === "field"}
          onClick={() => setMenu(menu === "field" ? null : "field")}
          className="flex h-[32px] w-[64px] cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
        >
          <IconMergeField />
          <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">Merge Field</span>
        </button>
        <button
          data-testid="btnHighlightMergeFields"
          aria-pressed={highlightFields}
          onClick={() => useMailStore.getState().toggleHighlight()}
          className="flex h-[32px] w-[64px] cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
        >
          <IconHighlightFields />
          <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">Highlight Fields</span>
        </button>
        <Popover open={menu === "field"} onClose={() => setMenu(null)} align="left-0">
          <MenuSection title="Merge Fields" />
          {MERGE_MASTER_FIELDS.map((f) => (
            <MenuItem
              key={f}
              onClick={() => {
                editor?.chain().focus().insertContent(`«${f}»`).run();
                setMenu(null);
              }}
            >
              {f}
            </MenuItem>
          ))}
        </Popover>
      </Group>

      {/* Preview Results */}
      <Group title="Preview Results">
        <RvCell
          title="Preview Results"
          icon={<IconPreviewResults />}
          testid="btnPreviewResults"
          active={preview}
          onClick={() => {
            setMenu(null);
            togglePreview();
          }}
        />
        <button
          data-testid="btnFirstRecord"
          aria-label="First record"
          disabled={!hasDoc || currentIdx === 0}
          onClick={() => useMailStore.getState().goFirst()}
          className="flex h-[32px] w-[30px] cursor-pointer items-center justify-center rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconFirstRecord />
        </button>
        <button
          data-testid="btnPrevRecord"
          aria-label="Previous record"
          disabled={!hasDoc || currentIdx === 0}
          onClick={() => go(-1)}
          className="flex h-[32px] w-[30px] cursor-pointer items-center justify-center rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        <span data-testid="record-indicator" className="text-[9px] text-[#5b5b5b]">
          {currentIdx + 1} / {recipients.length}
        </span>
        <button
          data-testid="btnNextRecord"
          aria-label="Next record"
          disabled={!hasDoc || currentIdx === recipients.length - 1}
          onClick={() => go(1)}
          className="flex h-[32px] w-[30px] cursor-pointer items-center justify-center rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
        <button
          data-testid="btnLastRecord"
          aria-label="Last record"
          disabled={!hasDoc || currentIdx === recipients.length - 1}
          onClick={() => useMailStore.getState().goLast()}
          className="flex h-[32px] w-[30px] cursor-pointer items-center justify-center rounded-[3px] border border-transparent text-[#474747] hover:border-[#c1d3ec] hover:bg-[#eaf1fa] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconLastRecord />
        </button>
      </Group>

      {/* Finish */}
      <Group title="Finish">
        <RvCell
          title="Check for Errors"
          icon={<IconCheckErrors />}
          testid="btnCheckErrors"
          onClick={() => {
            setMenu(null);
            setShowCheckErrors(true);
          }}
        />
        <RvCell
          title="Finish & Merge"
          icon={<IconFinishMerge />}
          testid="btnFinishMerge"
          onClick={() => {
            setMenu(null);
            setMergeDone(true);
          }}
        />
      </Group>

      {showRecipients && (
        <RecipientsDialog
          recipients={recipients}
          onClose={() => setShowRecipients(false)}
          onRemove={(id) => useMailStore.getState().removeRecipient(id)}
        />
      )}
      {showCheckErrors && (
        <CheckErrorsDialog
          recipients={recipients}
          onClose={() => setShowCheckErrors(false)}
          onSelect={useMailStore.getState().removeRecipient}
        />
      )}
      {mergeDone && (
        <FinishDialog
          recipients={recipients}
          onClose={() => setMergeDone(false)}
          onMerge={() => {
            setMergeDone(false);
            applyMergeToDoc();
          }}
          onPreview={() => {
            setMergeDone(false);
            togglePreview();
          }}
        />
      )}
      {void fields}
    </div>
  );
}

/* --- Recipients dialog --- */

function RecipientsDialog({
  recipients,
  onClose,
  onRemove,
}: {
  recipients: Recipient[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  const [nr, setNr] = useState({ FirstName: "", LastName: "", Email: "", City: "" });
  const addRecipient = useMailStore((s) => s.addRecipient);
  return (
    <Modal title="Select Recipients" onClose={onClose} testid="recipients-dialog">
      <div className="mb-2 max-h-[200px] overflow-auto rounded border border-[#e8e8e8] bg-[#fafafa]">
        {recipients.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between border-b border-[#f0f0f0] px-2 py-1 text-[12px]"
          >
            <span className="flex items-center gap-2">
              <input type="checkbox" defaultChecked aria-label={`Select ${r.FirstName}`} className="accent-[#4472c4]" />
              <span>
                <span className="font-medium text-[#333]">{r.FirstName} {r.LastName}</span>
                <span className="ml-2 text-[#8a8a8a]">{r.Email} · {r.City}</span>
              </span>
            </span>
            <button
              onClick={() => onRemove(r.id)}
              className="rounded p-0.5 text-[#8a1f1f] hover:bg-[#fde8e8]"
              aria-label={`Remove ${r.FirstName}`}
            >
              ✕
            </button>
          </div>
        ))}
        {recipients.length === 0 && <p className="p-3 text-[12px] text-[#9aa0a6]">No recipients left.</p>}
      </div>
      <div className="flex items-center gap-1">
        {(["FirstName", "LastName", "Email", "City"] as const).map((f) => (
          <input
            key={f}
            value={nr[f]}
            onChange={(e) => setNr((r) => ({ ...r, [f]: e.target.value }))}
            placeholder={f === "FirstName" ? "First" : f === "LastName" ? "Last" : f === "Email" ? "Email" : "City"}
            className="w-[78px] rounded border border-[#d0d0d0] px-2 py-1 text-[11px] focus:border-[#8ab4f8] focus:outline-none"
          />
        ))}
        <button
          data-testid="add-recipient"
          onClick={() => {
            if (!nr.FirstName) return;
            addRecipient({
              id: `r${Date.now()}`,
              FirstName: nr.FirstName,
              LastName: nr.LastName || "(n/a)",
              Company: "",
              Address: "",
              City: nr.City || "Unknown",
              State: "",
              Zip: "",
              Phone: "",
              Email: nr.Email || `${nr.FirstName.toLowerCase()}@example.com`,
            });
            setNr({ FirstName: "", LastName: "", Email: "", City: "" });
          }}
          className="rounded border border-[#4472c4] bg-[#d6e4f7] px-2 py-1 text-[11px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
        >
          Add
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={onClose} className="rounded border border-[#d0d0d0] px-3 py-1 text-[12px] hover:bg-[#f0f4fa]">
          Close
        </button>
      </div>
    </Modal>
  );
}

/* --- Check for Errors --- */

function CheckErrorsDialog({
  recipients,
  onClose,
  onSelect,
}: {
  recipients: Recipient[];
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const bad = recipients.filter((r) => !r.Email.includes("@"));
  return (
    <Modal title="Check for Errors" onClose={onClose} testid="check-errors-dialog">
      {bad.length === 0 ? (
        <div className="flex items-center gap-2 rounded border border-[#d6e4f7] bg-[#f2f8ff] p-3 text-[13px] text-[#1e4a80]">
          <span>✓</span> All {recipients.length} recipient rows look valid. Ready to merge.
        </div>
      ) : (
        <div className="rounded border border-[#fde2e6] bg-[#fff7f8] p-3">
          <p className="mb-2 text-[13px] font-semibold text-[#8a1f1f]">
            {bad.length} recipient{bad.length > 1 ? "s" : ""} with an invalid email address:
          </p>
          {bad.map((r, i) => (
            <div key={r.id} className="flex items-center justify-between py-0.5 text-[12px]">
              <span>{r.FirstName} {r.LastName} — <span className="text-[#8a1f1f]">{r.Email}</span></span>
              <button
                data-testid={`remove-bad-${i}`}
                onClick={() => onSelect(r.id)}
                className="rounded border border-[#d9798a] px-2 py-0.5 text-[11px] text-[#8a1f1f] hover:bg-[#fde2e6]"
              >
                Exclude
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex justify-end">
        <button onClick={onClose} className="rounded border border-[#d0d0d0] px-3 py-1 text-[12px] hover:bg-[#f0f4fa]">
          Close
        </button>
      </div>
    </Modal>
  );
}

/* --- Finish & Merge --- */

function FinishDialog({
  recipients,
  onClose,
  onMerge,
  onPreview,
}: {
  recipients: Recipient[];
  onClose: () => void;
  onMerge: () => void;
  onPreview: () => void;
}) {
  return (
    <Modal title="Finish & Merge" onClose={onClose} testid="finish-merge-dialog">
      <p className="text-[13px] text-[#333]">
        Your document contains merge fields for <b>{recipients.length}</b> recipient{recipients.length === 1 ? "" : "s"}.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={onPreview}
          className="rounded border border-[#4472c4] px-3 py-1 text-[12px] text-[#1e4a80] hover:bg-[#eaf1fa]"
        >
          Preview
        </button>
        <button
          data-testid="merge-now"
          onClick={onMerge}
          className="rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
        >
          Merge Now
        </button>
      </div>
    </Modal>
  );
}