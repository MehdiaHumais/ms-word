import { create } from "zustand";

export interface DocTab {
  id: string;
  title: string;
  path: string | null;
  dirty: boolean;
}

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

export type PageOrientation = "portrait" | "landscape";
export type PageSizeId = "a4" | "letter" | "a5" | "legal" | "executive";
export type ColumnsSetting = "one" | "two" | "three" | "left" | "right";
export type LineNumbersSetting = "none" | "continuous";
export type HyphenationSetting = "none" | "automatic" | "manual";
export type ShowMarkupSetting = "all" | "hidden" | "original";
export type ReviewPanel = "none" | "editor" | "thesaurus" | "accessibility" | "comments" | "changes" | "translator";
export type ReviewChange = { id: string; kind: "insert" | "delete"; text: string; prefix: string; author: string };
export type ReadAloudState = "stopped" | "playing" | "paused";
export type ViewMode = "print" | "web" | "outline" | "draft" | "read";

export const PAGE_SIZES: Record<PageSizeId, { label: string; width: number; height: number }> = {
  a4: { label: "A4", width: 8.27, height: 11.69 },
  letter: { label: "Letter", width: 8.5, height: 11 },
  a5: { label: "A5", width: 5.83, height: 8.27 },
  legal: { label: "Legal", width: 8.5, height: 14 },
  executive: { label: "Executive", width: 7.25, height: 10.5 },
};

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const MARGIN_PRESETS: { label: string; desc: string; margins: PageMargins }[] = [
  { label: "Normal", desc: '1\u2033 top, 1\u2033 bottom, 1\u2033 left, 1\u2033 right', margins: { top: 1, right: 1, bottom: 1, left: 1 } },
  { label: "Narrow", desc: '0.5\u2033 top, 0.5\u2033 bottom, 0.5\u2033 left, 0.5\u2033 right', margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 } },
  { label: "Moderate", desc: '1\u2033 top, 1\u2033 bottom, 0.75\u2033 left, 0.75\u2033 right', margins: { top: 1, right: 1, bottom: 1, left: 0.75 } },
  { label: "Wide", desc: '1\u2033 top, 1\u2033 bottom, 2\u2033 left, 2\u2033 right', margins: { top: 1, right: 2, bottom: 1, left: 2 } },
  { label: "Mirrored", desc: 'Inside 1\u2033, outside 1\u2033 (single-sided preview)', margins: { top: 1, right: 1.25, bottom: 1, left: 1.25 } },
];

interface AppState {
  tabs: DocTab[];
  activeId: string | null;
  zoom: number;
  findOpen: boolean;
  findMode: "find" | "replace";
  showHeader: boolean;
  showFooter: boolean;
  headerText: string;
  footerText: string;
  margins: PageMargins;
  pageSizeId: PageSizeId;
  orientation: PageOrientation;
  columns: ColumnsSetting;
  lineNumbers: LineNumbersSetting;
  hyphenation: HyphenationSetting;
  trackChanges: boolean;
  showMarkup: ShowMarkupSetting;
  reviewPanel: ReviewPanel;
  reviewingPane: "off" | "vertical";
  restrictReadOnly: boolean;
  final: boolean;
  showComments: boolean;
  proofingLang: string;
  changes: ReviewChange[];
  readAloud: ReadAloudState;
  viewMode: ViewMode;
  showRuler: boolean;
  showGridlines: boolean;
  showNavPane: boolean;
  splitView: boolean;
  pageColor: string;
  watermark: string | null;
  pageBorder: string | null;
  showInk: boolean;
  inkTool: "off" | "pen" | "highlighter" | "eraser" | "lasso";
  inkColor: string;
  inkWidth: number;
  themeId: string;
  showReferencePanel: boolean;
  referencePanel: "toc" | "footnotes" | "citations" | "index";
  outlineActive: boolean;
  macrosOpen: boolean;
  showFullScreen: boolean;
  filePage: string;
  /** Set when a file write fails; cleared once shown. Never set on success. */
  saveError: string | null;
  openDocument: (tab: DocTab) => void;
  setActive: (id: string) => void;
  closeDocument: (id: string) => void;
  markDirty: (id: string, dirty: boolean) => void;
  renameDocument: (id: string, title: string) => void;
  setPath: (id: string, path: string | null) => void;
  setFilePage: (page: string) => void;
  setSaveError: (message: string | null) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleFind: () => void;
  openFind: (mode?: "find" | "replace") => void;
  closeFind: () => void;
  setHeaderOpen: (open: boolean) => void;
  setFooterOpen: (open: boolean) => void;
  setHeaderText: (html: string) => void;
  setFooterText: (html: string) => void;
  setMargins: (margins: PageMargins) => void;
  setPageSizeId: (id: PageSizeId) => void;
  setOrientation: (orientation: PageOrientation) => void;
  setColumns: (columns: ColumnsSetting) => void;
  setLineNumbers: (lineNumbers: LineNumbersSetting) => void;
  setHyphenation: (hyphenation: HyphenationSetting) => void;
  setTrackChanges: (on: boolean) => void;
  setShowMarkup: (mode: ShowMarkupSetting) => void;
  setReviewPanel: (panel: ReviewPanel) => void;
  setReviewingPane: (mode: "off" | "vertical") => void;
  setRestrictReadOnly: (on: boolean) => void;
  setFinal: (on: boolean) => void;
  setShowComments: (on: boolean) => void;
  setProofingLang: (lang: string) => void;
  addChange: (change: ReviewChange) => void;
  removeChange: (id: string) => void;
  clearChanges: () => void;
  setReadAloud: (state: ReadAloudState) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleRuler: () => void;
  toggleGridlines: () => void;
  toggleNavPane: () => void;
  toggleSplit: () => void;
  setPageColor: (color: string) => void;
  setWatermark: (text: string | null) => void;
  setPageBorder: (border: string | null) => void;
  setInkTool: (tool: "off" | "pen" | "highlighter" | "eraser" | "lasso") => void;
  setInkColor: (color: string) => void;
  setInkWidth: (width: number) => void;
  setThemeId: (id: string) => void;
  setReferencePanel: (panel: "toc" | "footnotes" | "citations" | "index", open?: boolean) => void;
  setOutlineActive: (active: boolean) => void;
  setMacrosOpen: (open: boolean) => void;
  setFullScreen: (full: boolean) => void;
}

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

export const useAppStore = create<AppState>((set) => ({
  tabs: [],
  activeId: null,
  zoom: 100,
  findOpen: false,
  findMode: "find",
  showHeader: false,
  showFooter: false,
  headerText: "",
  footerText: "",
  margins: { top: 1, right: 1, bottom: 1, left: 1 },
  pageSizeId: "a4",
  orientation: "portrait",
  columns: "one",
  lineNumbers: "none",
  hyphenation: "none",
  trackChanges: false,
  showMarkup: "all",
  reviewPanel: "none",
  reviewingPane: "off",
  restrictReadOnly: false,
  final: false,
  showComments: true,
  proofingLang: "English (US)",
  changes: [],
  readAloud: "stopped",
  viewMode: "print",
  showRuler: false,
  showGridlines: false,
  showNavPane: false,
  splitView: false,
  pageColor: "white",
  watermark: null,
  pageBorder: null,
  showInk: false,
  inkTool: "off",
  inkColor: "#c00000",
  inkWidth: 2,
  themeId: "office",
  showReferencePanel: false,
  referencePanel: "toc",
  outlineActive: false,
  macrosOpen: false,
  showFullScreen: false,
  filePage: "home",
  saveError: null,

  openDocument: (tab) =>
    set((s) => {
      const existing = s.tabs.some((t) => t.id === tab.id);
      return {
        tabs: existing ? s.tabs : [...s.tabs, tab],
        activeId: tab.id,
      };
    }),

  setActive: (id) => set({ activeId: id }),

  closeDocument: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeId =
        s.activeId === id
          ? tabs.length > 0
            ? (tabs[tabs.length - 1]?.id ?? null)
            : null
          : s.activeId;
      return { tabs, activeId };
    }),

  markDirty: (id, dirty) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, dirty } : t)),
    })),

  renameDocument: (id, title) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
    })),

  setPath: (id, path) =>
    set((s) => ({
      tabs: s.tabs.map((t) => (t.id === id ? { ...t, path } : t)),
    })),

  setFilePage: (filePage) => set({ filePage }),

  setSaveError: (saveError) => set({ saveError }),

  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  zoomIn: () => set((s) => ({ zoom: clampZoom(s.zoom + ZOOM_STEP) })),
  zoomOut: () => set((s) => ({ zoom: clampZoom(s.zoom - ZOOM_STEP) })),

  toggleFind: () => set((s) => ({ findOpen: !s.findOpen })),
  openFind: (mode = "find") => set({ findOpen: true, findMode: mode }),
  closeFind: () => set({ findOpen: false }),
  setHeaderOpen: (showHeader) => set({ showHeader }),
  setFooterOpen: (showFooter) => set({ showFooter }),
  setHeaderText: (headerText) => set({ headerText }),
  setFooterText: (footerText) => set({ footerText }),
  setMargins: (margins) => set({ margins }),
  setPageSizeId: (pageSizeId) => set({ pageSizeId }),
  setOrientation: (orientation) => set({ orientation }),
  setColumns: (columns) => set({ columns }),
  setLineNumbers: (lineNumbers) => set({ lineNumbers }),
  setHyphenation: (hyphenation) => set({ hyphenation }),

  setTrackChanges: (trackChanges) => set({ trackChanges }),
  setShowMarkup: (showMarkup) => set({ showMarkup }),
  setReviewPanel: (reviewPanel) => set({ reviewPanel }),
  setReviewingPane: (reviewingPane) => set({ reviewingPane }),
  setRestrictReadOnly: (restrictReadOnly) => set({ restrictReadOnly }),
  setFinal: (final) => set({ final }),
  setShowComments: (showComments) => set({ showComments }),
  setProofingLang: (proofingLang) => set({ proofingLang }),
  addChange: (change) =>
    set((s) => ({ changes: [...s.changes, change] })),
  removeChange: (id) => set((s) => ({ changes: s.changes.filter((c) => c.id !== id) })),
  clearChanges: () => set({ changes: [] }),
  setReadAloud: (readAloud) => set({ readAloud }),
  setViewMode: (viewMode) => set({ viewMode }),
  toggleRuler: () => set((s) => ({ showRuler: !s.showRuler })),
  toggleGridlines: () => set((s) => ({ showGridlines: !s.showGridlines })),
  toggleNavPane: () => set((s) => ({ showNavPane: !s.showNavPane })),
  toggleSplit: () => set((s) => ({ splitView: !s.splitView })),
  setPageColor: (pageColor) => set({ pageColor }),
  setWatermark: (watermark) => set({ watermark }),
  setPageBorder: (pageBorder) => set({ pageBorder }),
  setInkTool: (inkTool) => set({ inkTool, showInk: inkTool !== "off" }),
  setInkColor: (inkColor) => set({ inkColor }),
  setInkWidth: (inkWidth) => set({ inkWidth }),
  setThemeId: (themeId) => set({ themeId }),
  setReferencePanel: (referencePanel, open = true) => set({ referencePanel, showReferencePanel: open }),
  setOutlineActive: (outlineActive) => set({ outlineActive }),
  setMacrosOpen: (macrosOpen) => set({ macrosOpen }),
  setFullScreen: (showFullScreen) => set({ showFullScreen }),
}));