import { useEffect, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { useEditorState } from "@tiptap/react";
import {
  MARGIN_PRESETS,
  PAGE_SIZES,
  useAppStore,
  type ColumnsSetting,
} from "../../stores/appStore";
import {
  IconAlignObjects,
  IconBringForward,
  IconColumns,
  IconDialogLauncher,
  IconGroupObjects,
  IconHyphenation,
  IconLayoutBreaks,
  IconLineNumbers,
  IconLineSpacing,
  IconMargins,
  IconOrientation,
  IconPageSize,
  IconPosition,
  IconRotate,
  IconSelectionPane,
  IconSendBackward,
  IconWrapText,
} from "./icons";

const btnBase =
  "relative flex items-center justify-center rounded-[3px] text-[#474747] transition-colors duration-75 ";
const btnHover = "border border-transparent hover:border-[#c1d3ec] hover:bg-[#eaf1fa]";
const btnActive = "border border-[#9fc4ec] bg-[#cfe3fb] text-[#1e4a80]";

// ---------- Building blocks ----------

function Popover({
  open,
  onClose,
  children,
  align = "left-0",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: string;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className={`absolute top-full z-20 mt-1 w-max rounded border border-[#c8c8c8] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.18)] ${align}`}
      >
        {children}
      </div>
    </>
  );
}

function MenuSection({ title }: { title: string }) {
  return (
    <div className="mb-0.5 px-1 pt-1 text-[9px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
      {title}
    </div>
  );
}

function MenuItem({
  onClick,
  children,
  desc,
  active,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  desc?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-start gap-2 rounded px-2 py-1 text-left ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : active
            ? "bg-[#cfe3fb] text-[#1e4a80]"
            : "text-[#333] hover:bg-[#eaf1fa]"
      }`}
    >
      <span className="w-3 shrink-0 text-[11px] leading-tight">{active ? "✓" : ""}</span>
      <span className="flex flex-col">
        <span className="text-[12px] leading-tight">{children}</span>
        {desc && <span className="text-[9px] text-[#8a8a8a]">{desc}</span>}
      </span>
    </button>
  );
}

/** Compact icon+label cell used in the Page Setup / Arrange galleries. */
function LCell({
  title,
  icon,
  onClick,
  active,
  disabled,
}: {
  title: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`${btnBase} ${disabled ? "cursor-not-allowed opacity-40" : active ? btnActive : btnHover} h-[32px] w-[52px] cursor-pointer flex-col gap-[3px] px-0.5`}
    >
      {icon}
      <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">{title}</span>
    </button>
  );
}

/** Word-style spin box (number stepper). */
function SpinBox({
  label,
  value,
  step,
  min = 0,
  onChange,
}: {
  label: string;
  value: string;
  step: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);

  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(/[^0-9.\-]/g, ""));
    if (Number.isFinite(n)) onChange(Math.max(min, Math.round(n * 100) / 100));
  };

  const nudge = (d: number) => {
    const cur = parseFloat(draft.replace(/[^0-9.\-]/g, "")) || min;
    onChange(Math.max(min, Math.round((cur + d) * 100) / 100));
  };

  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-[#5b5b5b]">{label}</span>
      <div className="flex h-[20px] overflow-hidden rounded border border-[#c8c8c8] bg-white focus-within:border-[#4472c4]">
        <input
          aria-label={label}
          className="h-full w-[38px] border-none text-center text-[12px] text-[#333] focus:outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            commit(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit(draft);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <span className="flex w-[14px] flex-col border-l border-[#e2e2e2]">
          <button
            aria-label={`Increase ${label}`}
            onClick={() => nudge(step)}
            className="flex h-1/2 items-center justify-center text-[7px] leading-none text-[#6b6b6b] hover:bg-[#eaf1fa]"
          >
            ▲
          </button>
          <button
            aria-label={`Decrease ${label}`}
            onClick={() => nudge(-step)}
            className="flex h-1/2 items-center justify-center border-t border-[#e2e2e2] text-[7px] leading-none text-[#6b6b6b] hover:bg-[#eaf1fa]"
          >
            ▼
          </button>
        </span>
      </div>
    </div>
  );
}

function Group({
  title,
  children,
  launcher,
  widthClass,
}: {
  title: string;
  children: ReactNode;
  launcher?: () => void;
  widthClass?: string;
}) {
  return (
    <div
      className={`relative flex h-[104px] flex-col items-center justify-between border-r border-[#e0e0e0] px-2 py-1 ${widthClass ?? ""}`}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-1">{children}</div>
      <span className="mt-0.5 text-[9px] leading-none text-[#5b5b5b]">{title}</span>
      {launcher && (
        <button
          aria-label={`${title} dialog launcher`}
          title="Paragraph dialog"
          onClick={launcher}
          className="absolute bottom-0.5 right-0.5 rounded-[3px] border border-transparent text-[#8a8a8a] hover:border-[#c1d3ec] hover:bg-[#eaf1fa]"
        >
          <IconDialogLauncher />
        </button>
      )}
    </div>
  );
}

// ---------- Style / helper utilities ----------

const trimNum = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");

const parseLen = (v: string | null | undefined): number => {
  if (!v) return 0;
  const m = v.match(/([\d.]+)(px|pt|in|cm|mm|em|%)?/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case "px":
      return n / 96;
    case "pt":
      return n / 72;
    case "cm":
      return n / 2.54;
    case "mm":
      return n / 25.4;
    default:
      return n;
  }
};

const ptToNum = (v: string | null | undefined): number => {
  if (!v) return 0;
  const m = v.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
};

const inDisplay = (v: string | null): string =>
  v ? `${trimNum(parseLen(v))}\u2033` : "0\u2033";
const ptDisplay = (v: string | null): string =>
  v ? `${trimNum(ptToNum(v))}pt` : "0pt";

/** Appends/overrides tokens from `patch` into an inline style string. */
function mergeStyle(base: string | null | undefined, patch: string): string {
  const tokens = patch
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean);
  const keys = new Set(tokens.map((t) => t.split(":")[0].trim()));
  const baseTokens = (base ?? "")
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !keys.has(t.split(":")[0].trim()));
  return [...baseTokens, ...tokens].join("; ");
}

function removeToken(base: string | null | undefined, key: string): string {
  return (base ?? "")
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !t.startsWith(`${key}:`))
    .join("; ");
}

// ---------- Main tab ----------

export function LayoutTab({ editor }: { editor: Editor }) {
  // Page Setup store state
  const margins = useAppStore((s) => s.margins);
  const setMargins = useAppStore((s) => s.setMargins);
  const pageSizeId = useAppStore((s) => s.pageSizeId);
  const setPageSizeId = useAppStore((s) => s.setPageSizeId);
  const orientation = useAppStore((s) => s.orientation);
  const setOrientation = useAppStore((s) => s.setOrientation);
  const columns = useAppStore((s) => s.columns);
  const setColumns = useAppStore((s) => s.setColumns);
  const lineNumbers = useAppStore((s) => s.lineNumbers);
  const setLineNumbers = useAppStore((s) => s.setLineNumbers);
  const hyphenation = useAppStore((s) => s.hyphenation);
  const setHyphenation = useAppStore((s) => s.setHyphenation);

  const [open, setOpen] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selPane, setSelPane] = useState(false);
  const close = () => setOpen(null);

  // Is the current selection a picture (arrange ops require one)?
  const isImageSelected = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const sel = e.state.selection;
      return sel instanceof NodeSelection && sel.node.type.name === "image";
    },
  });

  // Current paragraph formatting snapshot.
  const pAttrs = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const parent = e.state.doc.resolve(e.state.selection.from).parent;
      return {
        left: parent.attrs.indent ?? null,
        right: parent.attrs.rightIndent ?? null,
        before: parent.attrs.spaceBefore ?? null,
        after: parent.attrs.spaceAfter ?? null,
        line: parent.attrs.lineHeight ?? "default",
      };
    },
  });

  const currentBlockType = (): "paragraph" | "heading" => {
    const { from } = editor.state.selection;
    const type = editor.state.doc.resolve(from).parent.type.name;
    return type === "heading" ? "heading" : "paragraph";
  };

  const applyBlocks = (patch: Record<string, string | number | boolean | null>) => {
    editor.chain().focus().updateAttributes(currentBlockType(), patch).run();
  };

  const activePreset = MARGIN_PRESETS.find(
    (m) => JSON.stringify(m.margins) === JSON.stringify(margins),
  )?.label;

  // ---- Arrange helpers ----

  const applyImageStyle = (patch?: string) => {
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch, state }) => {
        const sel = state.selection;
        if (!(sel instanceof NodeSelection) || sel.node.type.name !== "image") return false;
        const next = patch === undefined ? null : mergeStyle(sel.node.attrs.style ?? null, patch);
        tr.setNodeMarkup(sel.from, undefined, { ...sel.node.attrs, style: next });
        dispatch?.(tr);
        return true;
      })
      .run();
  };

  /** Move the selected picture one layer forward/back (or to an edge). */
  const moveImage = (dir: 1 | -1, toEdge = false) => {
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch, state }) => {
        const sel = state.selection;
        if (!(sel instanceof NodeSelection) || sel.node.type.name !== "image") return false;
        const from = sel.from;
        const size = sel.node.nodeSize;
        const $pos = state.doc.resolve(from);
        const parent = $pos.parent;
        const contStart = $pos.start($pos.depth);
        const index = $pos.index();
        const steps = toEdge ? (dir > 0 ? parent.childCount - 1 - index : index) : 1;
        if (steps <= 0) return false;

        const childStart = (k: number): number => {
          let s = contStart;
          for (let i = 0; i < k; i++) s += parent.child(i).nodeSize;
          return s;
        };

        let insertPos: number;
        if (dir > 0) {
          const target = index + steps;
          if (target >= parent.childCount) return false;
          const sibling = parent.child(target);
          insertPos = childStart(target) - size + sibling.nodeSize;
        } else {
          const target = index - steps;
          if (target < 0) return false;
          insertPos = childStart(target);
        }

        tr.delete(from, from + size);
        tr.insert(insertPos, sel.node);
        tr.setSelection(NodeSelection.create(tr.doc, insertPos));
        tr.scrollIntoView();
        dispatch?.(tr);
        return true;
      })
      .run();
  };

  // ---- Menu content ----

  const marginsMenu = (
    <div className="w-56">
      {MARGIN_PRESETS.map((m) => (
        <MenuItem
          key={m.label}
          active={activePreset === m.label}
          onClick={() => {
            setMargins(m.margins);
            close();
          }}
          desc={m.desc}
        >
          {m.label}
        </MenuItem>
      ))}
      <MenuItem
        onClick={() => {
          close();
          setDialogOpen(true);
        }}
      >
        Custom Margins…
      </MenuItem>
    </div>
  );

  const orientationMenu = (
    <div className="w-48">
      <MenuItem
        active={orientation === "portrait"}
        onClick={() => {
          setOrientation("portrait");
          close();
        }}
      >
        Portrait
      </MenuItem>
      <MenuItem
        active={orientation === "landscape"}
        onClick={() => {
          setOrientation("landscape");
          close();
        }}
      >
        Landscape
      </MenuItem>
    </div>
  );

  const sizeMenu = (
    <div className="w-56">
      {(Object.keys(PAGE_SIZES) as (keyof typeof PAGE_SIZES)[]).map((id) => (
        <MenuItem
          key={id}
          active={pageSizeId === id}
          onClick={() => {
            setPageSizeId(id);
            close();
          }}
          desc={`${PAGE_SIZES[id].width}\u2033 × ${PAGE_SIZES[id].height}\u2033`}
        >
          {PAGE_SIZES[id].label}
        </MenuItem>
      ))}
    </div>
  );

  const COLUMN_OPTS: { id: ColumnsSetting; label: string }[] = [
    { id: "one", label: "One" },
    { id: "two", label: "Two" },
    { id: "three", label: "Three" },
    { id: "left", label: "Left" },
    { id: "right", label: "Right" },
  ];
  const columnsMenu = (
    <div className="w-40">
      {COLUMN_OPTS.map((c) => (
        <MenuItem
          key={c.id}
          active={columns === c.id}
          onClick={() => {
            setColumns(c.id);
            close();
          }}
        >
          {c.label}
        </MenuItem>
      ))}
    </div>
  );

  const breaksMenu = (
    <div className="w-64">
      <MenuSection title="Page Breaks" />
      <MenuItem
        onClick={() => {
          editor.chain().focus().insertPageBreak().run();
          close();
        }}
      >
        Page
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().insertLayoutBreak("column").run();
          close();
        }}
        desc="Start the next content in a new column"
      >
        Column
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().setHardBreak().run();
          close();
        }}
      >
        Text Wrapping
      </MenuItem>
      <MenuSection title="Section Breaks" />
      {(
        [
          ["nextPage", "Next Page"],
          ["continuous", "Continuous"],
          ["evenPage", "Even Page"],
          ["oddPage", "Odd Page"],
        ] as const
      ).map(([kind, label]) => (
        <MenuItem
          key={kind}
          onClick={() => {
            editor.chain().focus().insertLayoutBreak(kind).run();
            close();
          }}
          desc={kind === "nextPage" ? "Start the next section on the next page" : undefined}
        >
          {label}
        </MenuItem>
      ))}
    </div>
  );

  const lineNumbersMenu = (
    <div className="w-72">
      <MenuItem
        active={lineNumbers === "none"}
        onClick={() => {
          setLineNumbers("none");
          close();
        }}
      >
        None
      </MenuItem>
      <MenuItem
        active={lineNumbers === "continuous"}
        onClick={() => {
          setLineNumbers("continuous");
          close();
        }}
      >
        Continuous
      </MenuItem>
      <MenuItem
        onClick={() => {
          setLineNumbers("continuous");
          close();
        }}
      >
        Restart Each Page
      </MenuItem>
      <MenuItem
        onClick={() => {
          setLineNumbers("continuous");
          close();
        }}
      >
        Restart Each Section
      </MenuItem>
      <MenuItem
        disabled={isImageSelected}
        active={false}
        onClick={() => {
          applyBlocks({ suppressLineNum: true });
          close();
        }}
        desc="Exclude the current paragraph from numbering"
      >
        Suppress for Current Paragraph
      </MenuItem>
    </div>
  );

  const hyphensMenu = (
    <div className="w-56">
      <MenuItem
        active={hyphenation === "none"}
        onClick={() => {
          setHyphenation("none");
          close();
        }}
      >
        None
      </MenuItem>
      <MenuItem
        active={hyphenation === "automatic"}
        onClick={() => {
          setHyphenation("automatic");
          close();
        }}
      >
        Automatic
      </MenuItem>
      <MenuItem
        onClick={() => {
          editor.chain().focus().insertContent("\u00AD").run();
          close();
        }}
        desc="Insert a hyphen at the cursor"
      >
        Manual
      </MenuItem>
    </div>
  );

  const POSITIONS: { label: string; patch?: string }[] = [
    { label: "In Line with Text" },
    { label: "Position Top Left", patch: "float: left; width: 40%; margin-right: 8px" },
    { label: "Position Top Center", patch: "display: block; width: 45%; margin: 0 auto 8px" },
    { label: "Position Top Right", patch: "float: right; width: 40%; margin-left: 8px" },
    { label: "Position Middle Left", patch: "float: left; width: 33%; margin: 96px 8px 8px 0" },
    {
      label: "Position Middle Center",
      patch: "display: block; width: 45%; margin: 96px auto 8px",
    },
    { label: "Position Middle Right", patch: "float: right; width: 33%; margin: 96px 0 8px 8px" },
    { label: "Position Bottom Left", patch: "float: left; width: 40%; margin-top: 40%" },
    { label: "Position Bottom Center", patch: "display: block; width: 45%; margin: 40% auto 0" },
    { label: "Position Bottom Right", patch: "float: right; width: 40%; margin-top: 40%" },
  ];
  const positionMenu = (
    <div className="max-h-[300px] w-60 overflow-y-auto">
      {POSITIONS.map((p) => (
        <MenuItem
          key={p.label}
          onClick={() => {
            applyImageStyle(p.patch);
            close();
          }}
        >
          {p.label}
        </MenuItem>
      ))}
    </div>
  );

  const WRAP_OPTS: { label: string; patch?: string }[] = [
    { label: "In Line with Text" },
    { label: "Square", patch: "float: left; width: 40%; margin: 0 8px 4px 0" },
    { label: "Tight", patch: "float: left; width: 32%; margin: 0 6px 4px 0" },
    { label: "Through", patch: "float: left; width: 34%; margin: 0 8px 4px 0" },
    { label: "Top and Bottom", patch: "display: block; width: 55%; margin: 8px auto" },
    { label: "Behind Text", patch: "float: left; width: 40%; position: relative; z-index: 0; opacity: 0.75" },
    { label: "In Front of Text", patch: "float: left; width: 40%; position: relative; z-index: 1" },
  ];
  const wrapMenu = (
    <div className="w-56">
      {WRAP_OPTS.map((w) => (
        <MenuItem
          key={w.label}
          onClick={() => {
            applyImageStyle(w.patch);
            close();
          }}
        >
          {w.label}
        </MenuItem>
      ))}
    </div>
  );

  const ALIGN_OPTS = [
    { label: "Align Left", patch: "float: left; margin-right: 8px" },
    { label: "Align Center", patch: "display: block; margin-left: auto; margin-right: auto" },
    { label: "Align Right", patch: "float: right; margin-left: 8px" },
  ];
  const alignMenu = (
    <div className="w-48">
      {ALIGN_OPTS.map((a) => (
        <MenuItem
          key={a.label}
          disabled={!isImageSelected}
          onClick={() => {
            applyImageStyle(a.patch);
            close();
          }}
        >
          {a.label}
        </MenuItem>
      ))}
    </div>
  );

  const ROTATE_OPTS = [
    { label: "Rotate Right 90°", patch: "transform: rotate(90deg)" },
    { label: "Rotate Left 90°", patch: "transform: rotate(-90deg)" },
    { label: "Flip Vertical", patch: "transform: scaleY(-1)" },
    { label: "Flip Horizontal", patch: "transform: scaleX(-1)" },
  ];
  const rotateMenu = (
    <div className="w-48">
      {ROTATE_OPTS.map((r) => (
        <MenuItem
          key={r.label}
          disabled={!isImageSelected}
          onClick={() => {
            applyImageStyle(r.patch);
            close();
          }}
        >
          {r.label}
        </MenuItem>
      ))}
    </div>
  );

  const bringMenu = (
    <div className="w-48">
      <MenuItem
        disabled={!isImageSelected}
        onClick={() => {
          moveImage(1);
          close();
        }}
      >
        Bring Forward
      </MenuItem>
      <MenuItem
        disabled={!isImageSelected}
        onClick={() => {
          moveImage(1, true);
          close();
        }}
      >
        Bring to Front
      </MenuItem>
    </div>
  );

  const sendMenu = (
    <div className="w-48">
      <MenuItem
        disabled={!isImageSelected}
        onClick={() => {
          moveImage(-1);
          close();
        }}
      >
        Send Backward
      </MenuItem>
      <MenuItem
        disabled={!isImageSelected}
        onClick={() => {
          moveImage(-1, true);
          close();
        }}
      >
        Send to Back
      </MenuItem>
    </div>
  );

  const groupMenu = (
    <div className="w-56">
      <MenuItem disabled onClick={() => {}}>
        Group
      </MenuItem>
      <MenuItem disabled onClick={() => {}}>
        Ungroup
      </MenuItem>
    </div>
  );

  const LINES = [
    { v: "default", l: "1.08" },
    { v: "1.0", l: "1.0" },
    { v: "1.15", l: "1.15" },
    { v: "1.5", l: "1.5" },
    { v: "2.0", l: "2.0" },
    { v: "2.5", l: "2.5" },
    { v: "3.0", l: "3.0" },
  ];
  const lineMenu = (
    <div className="w-52">
      {LINES.map((x) => (
        <MenuItem
          key={x.v}
          active={pAttrs.line === x.v}
          onClick={() => {
            applyBlocks({ lineHeight: x.v });
            close();
          }}
        >
          {x.l}
        </MenuItem>
      ))}
    </div>
  );

  return (
    <div className="flex h-[104px] items-stretch">
      {/* ---- Page Setup ---- */}
      <Group title="Page Setup">
        <div className="flex gap-1">
          <div className="relative">
            <LCell title="Margins" icon={<IconMargins />} onClick={() => setOpen("margins")} />
            <Popover open={open === "margins"} onClose={close}>
              {marginsMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Orientation"
              active={orientation === "landscape"}
              icon={<IconOrientation />}
              onClick={() => setOpen("orientation")}
            />
            <Popover open={open === "orientation"} onClose={close}>
              {orientationMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell title="Size" icon={<IconPageSize />} onClick={() => setOpen("size")} />
            <Popover open={open === "size"} onClose={close}>
              {sizeMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Columns"
              active={columns !== "one"}
              icon={<IconColumns />}
              onClick={() => setOpen("columns")}
            />
            <Popover open={open === "columns"} onClose={close}>
              {columnsMenu}
            </Popover>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="relative">
            <LCell title="Breaks" icon={<IconLayoutBreaks />} onClick={() => setOpen("breaks")} />
            <Popover open={open === "breaks"} onClose={close} align="left-0">
              {breaksMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Line Numbers"
              active={lineNumbers !== "none"}
              icon={<IconLineNumbers />}
              onClick={() => setOpen("linenumbers")}
            />
            <Popover open={open === "linenumbers"} onClose={close}>
              {lineNumbersMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Hyphenation"
              active={hyphenation !== "none"}
              icon={<IconHyphenation />}
              onClick={() => setOpen("hyphens")}
            />
            <Popover open={open === "hyphens"} onClose={close}>
              {hyphensMenu}
            </Popover>
          </div>
        </div>
      </Group>

      {/* ---- Paragraph ---- */}
      <Group title="Paragraph" launcher={() => setDialogOpen(true)} widthClass="w-[248px]">
        <div className="flex items-end gap-2">
          <span className="w-[30px] text-[8px] text-[#5b5b5b]">Indent</span>
          <SpinBox
            label="Left"
            value={inDisplay(pAttrs.left)}
            step={0.1}
            onChange={(v) => {
              applyBlocks({ indent: v > 0 ? `${v}in` : null });
            }}
          />
          <SpinBox
            label="Right"
            value={inDisplay(pAttrs.right)}
            step={0.1}
            onChange={(v) => {
              applyBlocks({ rightIndent: v > 0 ? `${v}in` : null });
            }}
          />
          <div className="relative">
            <button
              title="Line spacing"
              onClick={() => setOpen("linespacing")}
              className="flex h-[20px] cursor-pointer items-center gap-1 rounded border border-[#c8c8c8] bg-white px-1.5 text-[9px] text-[#333] hover:border-[#c1d3ec] hover:bg-[#f3f8fd]"
            >
              <IconLineSpacing className="h-[13px] w-[13px]" />
              <span className="font-medium">{pAttrs.line === "default" ? "1.08" : pAttrs.line}</span>
              <span className="text-[7px] text-[#8a8a8a]">▼</span>
            </button>
            <Popover open={open === "linespacing"} onClose={close} align="right-0">
              {lineMenu}
            </Popover>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="w-[30px] text-[8px] text-[#5b5b5b]">Spacing</span>
          <SpinBox
            label="Before"
            value={pAttrs.before ? ptDisplay(pAttrs.before) : "8pt"}
            step={6}
            onChange={(v) => {
              applyBlocks({ spaceBefore: v > 0 ? `${v}pt` : null });
            }}
          />
          <SpinBox
            label="After"
            value={pAttrs.after ? ptDisplay(pAttrs.after) : "8pt"}
            step={6}
            onChange={(v) => {
              applyBlocks({ spaceAfter: v > 0 ? `${v}pt` : null });
            }}
          />
        </div>
      </Group>

      {/* ---- Arrange ---- */}
      <Group title="Arrange">
        <div className="flex gap-1">
          <div className="relative">
            <LCell
              title="Position"
              disabled={!isImageSelected}
              icon={<IconPosition />}
              onClick={() => setOpen("position")}
            />
            <Popover open={open === "position"} onClose={close}>
              {positionMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Wrap Text"
              disabled={!isImageSelected}
              icon={<IconWrapText />}
              onClick={() => setOpen("wraptext")}
            />
            <Popover open={open === "wraptext"} onClose={close}>
              {wrapMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Bring Forward"
              disabled={!isImageSelected}
              icon={<IconBringForward />}
              onClick={() => setOpen("bring")}
            />
            <Popover open={open === "bring"} onClose={close}>
              {bringMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Send Backward"
              disabled={!isImageSelected}
              icon={<IconSendBackward />}
              onClick={() => setOpen("send")}
            />
            <Popover open={open === "send"} onClose={close}>
              {sendMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Selection Pane"
              active={selPane}
              icon={<IconSelectionPane />}
              onClick={() => setSelPane((v) => !v)}
            />
          </div>
        </div>
        <div className="flex gap-1">
          <div className="relative">
            <LCell
              title="Align"
              disabled={!isImageSelected}
              icon={<IconAlignObjects />}
              onClick={() => setOpen("align")}
            />
            <Popover open={open === "align"} onClose={close}>
              {alignMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Group"
              disabled
              icon={<IconGroupObjects />}
              onClick={() => setOpen("group")}
            />
            <Popover open={open === "group"} onClose={close}>
              {groupMenu}
            </Popover>
          </div>
          <div className="relative">
            <LCell
              title="Rotate"
              disabled={!isImageSelected}
              icon={<IconRotate />}
              onClick={() => setOpen("rotate")}
            />
            <Popover open={open === "rotate"} onClose={close} align="right-0">
              {rotateMenu}
            </Popover>
          </div>
        </div>
      </Group>

      {dialogOpen && (
        <ParagraphDialog
          editor={editor}
          initial={pAttrs}
          onClose={() => setDialogOpen(false)}
        />
      )}
      {selPane && <SelectionPane editor={editor} onClose={() => setSelPane(false)} />}
    </div>
  );
}

type ParagraphSnapshot = {
  left: string | null;
  right: string | null;
  before: string | null;
  after: string | null;
  line: string;
};

// ---------- Paragraph dialog (dialog box launcher) ----------

function ParagraphDialog({
  editor,
  initial,
  onClose,
}: {
  editor: Editor;
  initial: ParagraphSnapshot;
  onClose: () => void;
}) {
  const fmtLeft = inDisplay(initial.left);
  const fmtRight = inDisplay(initial.right);
  const fmtBefore = ptDisplay(initial.before);
  const fmtAfter = ptDisplay(initial.after);

  const [left, setLeft] = useState(fmtLeft);
  const [right, setRight] = useState(fmtRight);
  const [before, setBefore] = useState(fmtBefore);
  const [after, setAfter] = useState(fmtAfter);
  const [line, setLine] = useState(initial.line === "default" ? "1.08" : initial.line);

  const blockType = () => {
    const { from } = editor.state.selection;
    const type = editor.state.doc.resolve(from).parent.type.name;
    return type === "heading" ? "heading" : "paragraph";
  };

  const apply = (patch: Record<string, string | null>) => {
    editor.chain().focus().updateAttributes(blockType(), patch).run();
  };

  const commitValue = (raw: string, fallback: string): number => {
    const n = parseFloat(raw.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? Math.max(0, Math.round(n * 100) / 100) : parseFloat(fallback) || 0;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-[360px] rounded-md border border-[#c8c8c8] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-4 py-2">
          <span className="text-[13px] font-semibold text-[#333]">Paragraph</span>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded px-1.5 text-[13px] leading-none text-[#5b5b5b] hover:bg-[#eaf1fa]"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 px-4 py-3">
          <div className="text-[11px] font-medium text-[#333]">Indents and Spacing</div>
          <SpinBox
            label="Left"
            value={left}
            step={0.1}
            onChange={(v) => setLeft(`${trimNum(v)}\u2033`)}
          />
          <SpinBox
            label="Right"
            value={right}
            step={0.1}
            onChange={(v) => setRight(`${trimNum(v)}\u2033`)}
          />
          <SpinBox
            label="Before"
            value={before}
            step={6}
            onChange={(v) => setBefore(`${v}pt`)}
          />
          <SpinBox label="After" value={after} step={6} onChange={(v) => setAfter(`${v}pt`)} />
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[#5b5b5b]">Line spacing</span>
            <select
              value={line}
              onChange={(e) => setLine(e.target.value)}
              className="h-[22px] rounded border border-[#c8c8c8] bg-white px-1 text-[12px] focus:border-[#4472c4] focus:outline-none"
            >
              {["1.08", "1.0", "1.15", "1.5", "2.0", "2.5", "3.0"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e0e0e0] px-4 py-2">
          <button
            onClick={() => {
              apply({
                indent: commitValue(left, "0") > 0 ? `${trimNum(commitValue(left, "0"))}in` : null,
                rightIndent:
                  commitValue(right, "0") > 0 ? `${trimNum(commitValue(right, "0"))}in` : null,
                spaceBefore:
                  commitValue(before, "0") > 0 ? `${commitValue(before, "0")}pt` : null,
                spaceAfter: commitValue(after, "0") > 0 ? `${commitValue(after, "0")}pt` : null,
              });
              onClose();
            }}
            className="rounded border border-[#c8c8c8] bg-[#f6f6f6] px-4 py-1 text-[12px] text-[#333] hover:bg-[#eaf1fa]"
          >
            OK
          </button>
          <button
            onClick={onClose}
            className="rounded border border-transparent px-4 py-1 text-[12px] text-[#333] hover:bg-[#f0f0f0]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Selection Pane ----------

function SelectionPane({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const objs = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const out: { type: string; pos: number; label: string }[] = [];
      e.state.doc.descendants((node, pos) => {
        if (node.type.name === "image" || node.type.name === "textBox") {
          out.push({
            type: node.type.name,
            pos,
            label: node.type.name === "image" ? "Picture" : "Text Box",
          });
        }
        return true;
      });
      return out;
    },
  });

  const toggle = (pos: number) => {
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch, state }) => {
        const node = state.doc.nodeAt(pos);
        if (!node) return false;
        const cur = node.attrs.style ?? "";
        const hidden = cur.includes("visibility: hidden");
        const next = hidden ? removeToken(cur, "visibility") : mergeStyle(cur, "visibility: hidden");
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, style: next || null });
        dispatch?.(tr);
        return true;
      })
      .run();
  };

  const setAll = (visible: boolean) => {
    editor
      .chain()
      .focus()
      .command(({ tr, dispatch, state }) => {
        let ok = false;
        state.doc.descendants((node, pos) => {
          if (node.type.name === "image" || node.type.name === "textBox") {
            const cur = node.attrs.style ?? "";
            const hidden = cur.includes("visibility: hidden");
            const next = hidden === visible ? cur : visible ? removeToken(cur, "visibility") : mergeStyle(cur, "visibility: hidden");
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, style: next || null });
            ok = true;
          }
          return true;
        });
        if (!ok) return false;
        dispatch?.(tr);
        return true;
      })
      .run();
  };

  return (
    <div className="fixed right-0 top-[138px] z-30 flex h-[calc(100%-138px)] w-[240px] flex-col border-l border-[#c8c8c8] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-between border-b border-[#e0e0e0] px-3 py-2">
        <span className="text-[12px] font-semibold text-[#333]">Selection</span>
        <button
          aria-label="Close Selection Pane"
          onClick={onClose}
          className="rounded px-1.5 text-[12px] leading-none text-[#5b5b5b] hover:bg-[#eaf1fa]"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-2 border-b border-[#e0e0e0] px-3 py-1.5">
        <button
          onClick={() => setAll(true)}
          className="rounded border border-[#c8c8c8] bg-[#f6f6f6] px-2 py-0.5 text-[10px] text-[#333] hover:bg-[#eaf1fa]"
        >
          Show All
        </button>
        <button
          onClick={() => setAll(false)}
          className="rounded border border-[#c8c8c8] bg-[#f6f6f6] px-2 py-0.5 text-[10px] text-[#333] hover:bg-[#eaf1fa]"
        >
          Hide All
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {objs.length === 0 && (
          <div className="px-2 py-3 text-[11px] text-[#8a8a8a]">
            No objects on this page.
          </div>
        )}
        {objs.map((o, i) => (
          <div
            key={`${o.type}-${o.pos}`}
            className="flex items-center justify-between rounded px-2 py-1 hover:bg-[#f3f8fd]"
          >
            <span className="text-[12px] text-[#333]">
              {o.label} {i + 1}
            </span>
            <button
              aria-label={`Toggle visibility of ${o.label} ${i + 1}`}
              onClick={() => toggle(o.pos)}
              className="flex h-[20px] w-[20px] items-center justify-center rounded border border-[#c8c8c8] bg-white text-[10px] text-[#666] hover:bg-[#eaf1fa]"
            >
              👁
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}