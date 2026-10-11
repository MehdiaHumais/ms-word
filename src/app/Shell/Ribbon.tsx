import { useState } from "react";
import { useEditorContext } from "../Editor/EditorContext";
import { HomeTab } from "./HomeTab";
import { InsertTab } from "./InsertTab";
import { DrawTab } from "./DrawTab";
import { DesignTab } from "./DesignTab";
import { LayoutTab } from "./LayoutTab";
import { ReferencesTab } from "./ReferencesTab";
import { MailingsTab } from "./MailingsTab";
import { ReviewTab } from "./ReviewTab";
import { ViewTab } from "./ViewTab";
import { HelpTab } from "./HelpTab";
import { NAV_GROUPS, type FilePage } from "./FileTab";
import { Popover, MenuSection, MenuItem } from "./tabKit";
import { isDesktopApp } from "../../domain/env";
import { useAppStore } from "../../stores/appStore";

const RIBBON_TABS = [
  "Home",
  "Insert",
  "Draw",
  "Design",
  "Layout",
  "References",
  "Mailings",
  "Review",
  "View",
  "Help",
] as const;
export type RibbonTab = (typeof RIBBON_TABS)[number] | "File";

// ---------- Ribbon shell ----------

export function Ribbon({
  activeTab,
  onTabChange,
}: {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
}) {
  const editor = useEditorContext();
  const [fileOpen, setFileOpen] = useState(false);
  const desktop = isDesktopApp();

  const pickFilePage = (page: FilePage) => {
    useAppStore.getState().setFilePage(page);
    setFileOpen(false);
    onTabChange("File");
  };

  return (
    <div className="border-b border-[#c8c8c8] bg-[#f3f3f3]">
      <nav
        className="flex h-[34px] items-end gap-0.5 pl-1.5"
        role="tablist"
        aria-label="Ribbon tabs"
      >
        <div className="relative mr-1">
          <button
            role="tab"
            aria-selected={activeTab === "File"}
            aria-haspopup="menu"
            aria-expanded={!desktop && fileOpen}
            data-testid="tab-file"
            onMouseDown={() => {
              if (!desktop) setFileOpen((o) => !o);
            }}
            onClick={() => {
              if (desktop) onTabChange("File");
            }}
            className={`h-[26px] cursor-pointer rounded-[3px] px-4 text-[13px] font-semibold transition-colors ${
              activeTab === "File" || (!desktop && fileOpen)
                ? "bg-[#185abd] text-white"
                : "bg-[#2b579a] text-white hover:bg-[#185abd]"
            }`}
          >
            File
          </button>
          {!desktop && (
            <Popover open={fileOpen} onClose={() => setFileOpen(false)}>
              <div className="w-[236px] pb-1" data-testid="file-menu">
                {NAV_GROUPS.map((g) => (
                  <div key={g.label} className="mb-0.5">
                    <MenuSection title={g.label} />
                    {g.items.map((it) => (
                      <MenuItem key={it.page} onClick={() => pickFilePage(it.page)}>
                        <span className="flex items-center gap-2 text-[12.5px]">
                          <span className="text-[#1e4a80]">{it.icon}</span>
                          <span>{it.label}</span>
                        </span>
                      </MenuItem>
                    ))}
                  </div>
                ))}
              </div>
            </Popover>
          )}
        </div>
        {RIBBON_TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => onTabChange(tab)}
            className={`mb-0.5 rounded-t-[4px] px-4 py-1 text-[13px] transition-colors ${
              activeTab === tab
                ? "border border-b-0 border-[#c8c8c8] bg-[#f3f3f3] font-semibold text-[#1a1a1a]"
                : "border border-transparent text-[#444] hover:bg-[#e5e5e5]"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
      {activeTab !== "File" && (
        <div className="overflow-x-auto border-t border-[#c8c8c8]">
        <div className="w-max">
          {activeTab === "Home" && <HomeTab editor={editor} />}
          {activeTab === "Insert" && <InsertTab editor={editor} />}
          {activeTab === "Draw" && <DrawTab />}
          {activeTab === "Design" && <DesignTab />}
          {activeTab === "Layout" && <LayoutTab editor={editor} />}
          {activeTab === "References" && <ReferencesTab />}
          {activeTab === "Mailings" && <MailingsTab />}
          {activeTab === "Review" && <ReviewTab />}
          {activeTab === "View" && <ViewTab />}
          {activeTab === "Help" && <HelpTab />}
        </div>
      </div>
      )}
    </div>
  );
}