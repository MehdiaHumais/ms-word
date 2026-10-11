import { useEffect, useState, type ReactNode } from "react";

export const btnBase =
  "relative flex items-center justify-center rounded-[3px] text-[#474747] transition-colors duration-75 ";
export const btnHover = "border border-transparent hover:border-[#c1d3ec] hover:bg-[#eaf1fa]";
export const btnActive = "border border-[#9fc4ec] bg-[#cfe3fb] text-[#1e4a80]";

export function Group({
  title,
  children,
  widthClass,
}: {
  title: string;
  children: ReactNode;
  widthClass?: string;
}) {
  return (
    <div
      className={`relative flex h-[104px] shrink-0 flex-col items-center justify-between border-r border-[#e0e0e0] px-1.5 py-1 ${widthClass ?? ""}`}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-1">{children}</div>
      <span className="mt-0.5 text-[9px] leading-none text-[#5b5b5b]">{title}</span>
    </div>
  );
}

export function RvCell({
  title,
  icon,
  onClick,
  active,
  disabled,
  wide,
  danger,
  badge,
  testid,
}: {
  title: string;
  icon?: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  wide?: boolean;
  danger?: boolean;
  badge?: number | null;
  testid?: string;
}) {
  const activeCls = danger
    ? "border border-[#d9798a] bg-[#fde2e6] text-[#8a1f1f]"
    : btnActive;
  return (
    <button
      title={title}
      aria-label={title}
      data-testid={testid}
      onClick={onClick}
      disabled={disabled}
      className={`${btnBase} ${
        disabled ? "cursor-not-allowed opacity-40" : active ? activeCls : btnHover
      } ${wide ? "h-[32px] w-[64px]" : "h-[32px] w-[42px]"} cursor-pointer flex-col gap-[2px] px-0.5`}
    >
      <span className="relative">
        {icon}
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -right-2.5 -top-2 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#d93025] px-0.5 text-[9px] font-bold text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="w-full text-center text-[7.5px] leading-[8px] text-[#444]">{title}</span>
    </button>
  );
}

export function Popover({
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className={`absolute top-full z-50 mt-1 w-max rounded border border-[#c8c8c8] bg-white p-1 shadow-[0_4px_12px_rgba(0,0,0,0.18)] ${align}`}
      >
        {children}
      </div>
    </>
  );
}

export function MenuSection({ title }: { title: string }) {
  return (
    <div className="mb-0.5 px-1 pt-1 text-[9px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
      {title}
    </div>
  );
}

export function MenuItem({
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

export function Modal({
  title,
  onClose,
  children,
  testid,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  testid?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
      <div
        className="flex max-h-[80vh] w-[560px] flex-col rounded bg-white shadow-[0_16px_60px_rgba(0,0,0,0.35)]"
        data-testid={testid}
      >
        <div className="flex items-center justify-between border-b border-[#e8e8e8] px-4 py-2.5">
          <span className="text-[14px] font-semibold text-[#1b1b1b]">{title}</span>
          <button className="text-[#5b5b5b] hover:text-[#0078d4]" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function useDocTick(editor: { on: (e: string, cb: () => void) => void; off: (e: string, cb: () => void) => void } | null): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);
  return tick;
}

export function groupDataTestid(name: string) {
  return `grp-${name}`;
}