import { useAppStore } from "../../stores/appStore";

export function TabsBar() {
  const { tabs, activeId, setActive, closeDocument } = useAppStore();

  if (tabs.length === 0) {
    return (
      <div className="flex h-8 items-center gap-1 border-b border-slate-300 bg-slate-100 px-2 text-xs text-slate-400">
        No open documents — open one first.
      </div>
    );
  }

  return (
    <div
      className="flex h-8 items-center gap-1 overflow-x-auto border-b border-slate-300 bg-slate-100 px-2"
      role="tablist"
      aria-label="Open documents"
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeId}
          onClick={() => setActive(tab.id)}
          className={`flex max-w-52 cursor-pointer select-none items-center gap-2 rounded-t px-3 py-1 text-xs ${
            tab.id === activeId
              ? "border border-b-white bg-white text-slate-800"
              : "text-slate-500 hover:bg-slate-200"
          }`}
        >
          <span className="truncate">
            {tab.title}
            {tab.dirty ? " •" : ""}
          </span>
          <button
            aria-label={`Close ${tab.title}`}
            title={`Close ${tab.title}`}
            onClick={(e) => {
              e.stopPropagation();
              closeDocument(tab.id);
            }}
            className="rounded px-1 hover:bg-slate-300"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}