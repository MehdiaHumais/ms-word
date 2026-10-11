import { useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { Group, RvCell, Popover, MenuSection, MenuItem, Modal } from "./tabKit";
import {
  IconHelp,
  IconFeedback,
  IconAbout,
  IconContact,
  IconVoice,
} from "./icons";

const HELP_TOPICS = [
  { q: "How do I format text like Word 365?", a: "Select text and use the Home tab — bold, italic, underline, highlight, font and size dropdowns all work live." },
  { q: "Can I track changes and comments?", a: "Yes. The Review tab has Track Changes, inline comments, a reviewing pane, spell check, thesaurus, translate and compare/combine." },
  { q: "How do insert tables, images and shapes?", a: "Use the Insert tab — Table, Picture, Shape, Text Box, WordArt, Equation, Header/Footer and page numbering are all supported." },
  { q: "How do I change margins or orientation?", a: "Go to the Layout tab: Margins, Orientation, Size, Columns, and paragraph spacing are all available there." },
  { q: "How do the Design themes work?", a: "The Design tab offers theme galleries, watermark, page color and paragraph spacing presets that restyle your document instantly." },
  { q: "Can I build mail-merge letters?", a: "The Mailings tab manages recipients, merge fields, address blocks, preview and finish & merge." },
  { q: "How do footnotes and citations work?", a: "References tab: Insert Footnote/Endnote, add sources, insert citations and build a bibliography." },
  { q: "What drawing tools are available?", a: "The Draw tab has pens, a highlighter, an eraser, lasso selection, ink replay and Ink to Text/Shape/Math conversion." },
];

export function HelpTab() {
  const editor = useEditorContext();
  const [menu, setMenu] = useState<null | string>(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState<number | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const topics = HELP_TOPICS.filter((t) =>
    !search || `${t.q} ${t.a}`.toLowerCase().includes(search.toLowerCase()),
  );

  const runVoiceCommand = (cmd: string) => {
    const c = cmd.toLowerCase();
    if (editor) {
      if (c.includes("open")) openHelp("open");
      else if (c.includes("document") && c.includes("new")) editor.chain().focus().clearContent(true).run();
      else if (c.includes("bold")) editor.chain().focus().toggleBold().run();
      else if (c.includes("italic")) editor.chain().focus().toggleItalic().run();
      else if (c.includes("save")) setShowFeedback(true);
      else openHelp("voice");
    }
    setMenu(null);
  };

  const openHelp = (place: string) => {
    wash();
    setTopic(0);
    void place;
  };

  const wash = () => {
    /* nothing to wash; kept for option-flow symmetry */
  };

  return (
    <div className="flex h-[104px] items-stretch px-1" data-testid="help-tab">
      {/* Help */}
      <Group title="Help">
        <RvCell
          title="Help"
          icon={<IconHelp />}
          testid="btnHelp"
          active={menu === "help"}
          onClick={() => setMenu(menu === "help" ? null : "help")}
        />
        <RvCell title="Contact Support" icon={<IconContact />} testid="btnContact" onClick={() => { setMenu(null); setTopic(0); }} />
        <Popover open={menu === "help"} onClose={() => setMenu(null)} align="left-0">
          <MenuSection title="Help" />
          <MenuItem onClick={() => { setMenu(null); setTopic(0); }}>Getting Started</MenuItem>
          <MenuItem onClick={() => { setMenu(null); setTopic(null); }}>Search Topics…</MenuItem>
          <MenuItem
            onClick={() => {
              setMenu(null);
              window.open("https://support.microsoft.com/en-us/word", "_blank");
            }}
          >
            Browse Microsoft Support
          </MenuItem>
        </Popover>
      </Group>

      {/* Community */}
      <Group title="Community">
        <RvCell
          title="Feedback"
          icon={<IconFeedback />}
          testid="btnFeedback"
          onClick={() => {
            setMenu(null);
            setShowFeedback(true);
          }}
        />
        <RvCell
          title="Tell Us What You Like"
          icon={<IconFeedback />}
          testid="btnLike"
          onClick={() => {
            setMenu(null);
            setShowFeedback(true);
          }}
        />
      </Group>

      {/* Resources */}
      <Group title="Resources">
        <RvCell
          title="What's New"
          icon={<IconAbout />}
          testid="btnWhatsNew"
          onClick={() => {
            setMenu(null);
            setTopic(null);
          }}
        />
        <RvCell
          title="Voice"
          icon={<IconVoice />}
          testid="btnVoice"
          active={menu === "voice"}
          onClick={() => setMenu(menu === "voice" ? null : "voice")}
        />
        <Popover open={menu === "voice"} onClose={() => setMenu(null)} align="right-0">
          <MenuSection title="Voice Command" />
          {["Open Help", "Save & Share", "Make it Bold", "New Document"].map((c) => (
            <MenuItem key={c} onClick={() => runVoiceCommand(c)}>
              {c}
            </MenuItem>
          ))}
        </Popover>
      </Group>

      {/* About */}
      <Group title="About">
        <RvCell
          title="About BritDocs"
          icon={<IconAbout />}
          testid="btnAbout"
          onClick={() => {
            setMenu(null);
            setShowAbout(true);
          }}
        />
      </Group>

      {/* Content area (below ribbon) */}
      {topic !== null && !showAbout && !showFeedback && (
        <HelpBrowser search={search} setSearch={setSearch} topics={topics} topic={topic} setTopic={setTopic} onClose={() => setTopic(null)} />
      )}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
      {showFeedback && <FeedbackDialog onClose={() => setShowFeedback(false)} editor={editor} />}
      {void wash}
    </div>
  );
}

function HelpBrowser({
  search,
  setSearch,
  topics,
  topic,
  setTopic,
  onClose,
}: {
  search: string;
  setSearch: (s: string) => void;
  topics: { q: string; a: string }[];
  topic: number | null;
  setTopic: (n: number | null) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Word Help in BritDocs" onClose={onClose} testid="help-dialog">
      <div className="flex h-[24px] items-center rounded border border-[#d0d0d0] bg-[#f1f3f4] px-2">
        <svg className="h-3.5 w-3.5 text-[#70757a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search help…"
          aria-label="Search help"
          className="ml-1 flex-1 bg-transparent text-[12px] outline-none"
        />
      </div>
      <div className="mt-2 flex h-[46vh] gap-2">
        <div className="w-[220px] shrink-0 overflow-auto border-r border-[#ececec] pr-1">
          {topics.map((t, i) => (
            <button
              key={i}
              data-testid="help-topic"
              onClick={() => setTopic(i)}
              className={`mb-0.5 block w-full rounded px-2 py-1 text-left text-[12px] hover:bg-[#eaf1fa] ${topic === i ? "bg-[#cfe3fb] text-[#1e4a80]" : "text-[#333]"}`}
            >
              {t.q}
            </button>
          ))}
          {topics.length === 0 && <p className="p-2 text-[11px] text-[#9aa0a6]">No topics match.</p>}
        </div>
        <div data-testid="help-answer" className="min-w-0 flex-1 overflow-auto text-[12px] leading-relaxed text-[#333]">
          {topic !== null && topics[topic] ? (
            <>
              <h4 className="mb-1 text-[13px] font-semibold text-[#1b1b1b]">{topics[topic].q}</h4>
              <p>{topics[topic].a}</p>
            </>
          ) : (
            <p className="text-[#8a8a8a]">Select a topic on the left to read how to do it.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="About BritDocs" onClose={onClose} testid="about-dialog">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded bg-gradient-to-br from-[#4472c4] to-[#2e5aa8] text-[20px] font-black text-white">
          W
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[#1b1b1b]">BritDocs — Word 365 Clone</p>
          <p className="mt-1 max-w-md text-[12px] leading-relaxed text-[#555]">
            A fully client-side word processor inspired by Microsoft Word 365. Every ribbon
            tab — Home, Insert, Draw, Design, Layout, References, Mailings, Review, View and Help —
            is powered by Tiptap and local state, with no backend required.
          </p>
          <p className="mt-2 text-[11px] text-[#8a8a8a]">Version 1.0.0 · Built with React, Tiptap and Zustand.</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="rounded border border-[#4472c4] bg-[#d6e4f7] px-4 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

function FeedbackDialog({ onClose, editor }: { onClose: () => void; editor: ReturnType<typeof useEditorContext> }) {
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);
  return (
    <Modal title="Send Feedback" onClose={onClose} testid="feedback-dialog">
      {sent ? (
        <div className="rounded border border-[#d6e4f7] bg-[#f2f8ff] p-4 text-center text-[13px] text-[#1e4a80]">
          ✓ Thanks! Your feedback helps shape BritDocs.
        </div>
      ) : (
        <>
          <p className="mb-2 text-[12px] text-[#555]">How likely are you to recommend BritDocs?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                aria-label={`Rating ${n}`}
                onClick={() => setRating(n)}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border text-[13px] transition ${n <= rating ? "border-[#4472c4] bg-[#cfe3fb] text-[#1e4a80]" : "border-[#d0d0d0] text-[#8a8a8a] hover:bg-[#eaf1fa]"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            placeholder="Tell us what you like or what we could improve…"
            data-testid="feedback-text"
            className="mt-3 w-full rounded border border-[#d0d0d0] px-2 py-1 text-[12px] focus:border-[#8ab4f8] focus:outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={onClose} className="rounded border border-[#d0d0d0] px-3 py-1 text-[12px] hover:bg-[#f0f4fa]">
              Cancel
            </button>
            <button
              data-testid="send-feedback"
              onClick={() => {
                setSent(true);
                void editor;
              }}
              className="rounded border border-[#4472c4] bg-[#d6e4f7] px-3 py-1 text-[12px] font-semibold text-[#1e4a80] hover:bg-[#c9dcf3]"
            >
              Send
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}