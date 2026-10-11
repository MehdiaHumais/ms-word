import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 18,
  height: 18,
  ...props,
});

export const IconBold = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" />
    <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" />
  </svg>
);

export const IconItalic = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
);

export const IconUnderline = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
    <line x1="5" y1="20" x2="19" y2="20" />
  </svg>
);

export const IconStrike = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 12V8a5 5 0 0 1 8-3.5" />
    <path d="M16 6v2a5 5 0 0 1-4 4.9" />
    <path d="M18 12H6" />
    <path d="M18 16a5 5 0 0 1-8 3.5" />
  </svg>
);

export const IconAlignLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="14" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

export const IconAlignCenter = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

export const IconAlignRight = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="10" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

export const IconAlignJustify = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

export const IconListBullet = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="8" r="1" fill="currentColor" />
    <circle cx="6" cy="16" r="1" fill="currentColor" />
    <line x1="10" y1="8" x2="20" y2="8" />
    <line x1="10" y1="16" x2="20" y2="16" />
  </svg>
);

export const IconListOrdered = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6h14M6 12h14M6 18h14" />
    <path d="M3 5l2-1v4M3 12l1-.5 1 .5-1 1 1 1M3 17h2l-2 3h2" transform="translate(0 0)" />
  </svg>
);

export const IconQuote = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 10c0-2 1-3 3-3" />
    <path d="M5 14h6v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
    <path d="M15 10c0-2 1-3 3-3" />
    <path d="M15 14h6v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
  </svg>
);

export const IconUndo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10a6 6 0 0 1 6 6v1" />
  </svg>
);

export const IconRedo = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H10a6 6 0 0 0-6 6v1" />
  </svg>
);

export const IconLink = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1 1" />
    <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1-1" />
  </svg>
);

export const IconHighlight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 11l6-6a2.1 2.1 0 0 1 3 3l-6 6" />
    <path d="M5 19l2-5 4-4 4 4-4 4-6 1z" transform="translate(-1 -2)" />
  </svg>
);

export const IconTextColor = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3L18 18M12 3L6 18M9.5 14h5" />
  </svg>
);

export const IconRule = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="8" y1="6" x2="16" y2="6" />
  </svg>
);

export const IconImage = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M3 17l5-5 4 4 3-3 6 6" />
  </svg>
);

export const IconPageBreak = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4v6M12 14h.01M12 20h.01" />
  </svg>
);

export const IconClipboard = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4a2 2 0 0 1 6 0v1H9z" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </svg>
);

export const IconScissors = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <path d="M8.3 7.7 20 19M8.3 16.3 20 5" />
  </svg>
);

export const IconGrowFont = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v5M9.5 5.5 12 3l2.5 2.5" />
    <path d="M4 21l5-13 5 13" />
    <path d="M5.5 16h7" />
  </svg>
);

export const IconShrinkFont = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 18l5-13 5 13" />
    <path d="M5.5 14h7" />
    <path d="M12 19v-5M9.5 16.5 12 19l2.5-2.5" />
  </svg>
);

export const IconSubscript = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5l6 6m0-6-6 6" />
    <path d="M17 16h3l-3 4h3" />
  </svg>
);

export const IconSuperscript = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 19l6-6m0 6-6-6" />
    <path d="M17 7h3l-3 4h3" />
  </svg>
);

export const IconClearFormat = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 4l14 0" />
    <path d="M10 4v14l4 4v-18" />
    <path d="M18 9v3" />
  </svg>
);

export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const IconPaste = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4a2 2 0 0 1 6 0v1H9z" />
    <path d="M9 14h6M9 11h6M12 17v-8" />
  </svg>
);

export const IconFormatPainter = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 4H9a3 3 0 0 0-3 3v1h9a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3H5" />
    <path d="M15 8h2a2 2 0 0 1 2 2v5h-2" />
    <path d="M17 10v12" />
  </svg>
);

export const IconIndentIncrease = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12l4-3v6l-4-3zM4 18h16" />
  </svg>
);

export const IconIndentDecrease = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 18h16" />
    <path d="M14 12l4-3v6l-4-3z" />
  </svg>
);

export const IconMultilevel = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 5h7 8" />
    <circle cx="1.5" cy="5" r="1" fill="currentColor" />
    <path d="M3 12H9 16" />
    <circle cx="1.5" cy="12" r="1" fill="currentColor" />
    <path d="M3 19h6 6" />
    <circle cx="1.5" cy="19" r="1" fill="currentColor" />
  </svg>
);

export const IconBorders = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M3 9h18M3 15h18M9 3v18" />
  </svg>
);

export const IconReplace = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h11" />
    <path d="M12 4l3 3-3 3" />
    <path d="M20 17H9" />
    <path d="M12 20l-3-3 3-3" />
  </svg>
);

export const IconSelect = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 3l10 8-4.5 1L11 17z" />
  </svg>
);

export const IconImport = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v12" />
    <path d="M8 11l4 4 4-4" />
    <path d="M4 21h16" />
  </svg>
);

export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconBulletAsc = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="5" cy="7" r="1" fill="currentColor" />
    <line x1="9" y1="7" x2="20" y2="7" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="17" x2="20" y2="17" />
    <path d="M3 17l-1.5 1.5m0-3L3 17l1.5-1.5" transform="translate(0 -1)" />
  </svg>
);

// ---------- Insert tab icons ----------

export const IconCoverPage = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <line x1="8" y1="8" x2="16" y2="8" />
    <line x1="8" y1="11" x2="16" y2="11" />
    <path d="M8 15h4" />
  </svg>
);

export const IconBlankPage = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
  </svg>
);

export const IconTable = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <path d="M3 9h18M3 14h18M9 4v16M15 4v16" />
  </svg>
);

export const IconShapes = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="8" height="8" rx="1" />
    <circle cx="17" cy="6" r="3.5" />
    <path d="M12.5 21l-4.4-8h8.8z" />
  </svg>
);

export const IconGallery = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
  </svg>
);

export const IconIconGrid = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="8" r="2.5" />
    <circle cx="16" cy="8" r="2.5" />
    <circle cx="8" cy="16" r="2.5" />
    <circle cx="16" cy="16" r="2.5" />
  </svg>
);

export const IconModel3D = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2.5l8 4.5v10l-8 4.5-8-4.5V7z" />
    <path d="M12 7v10m0-10L4 10" />
    <path d="M12 2.5v4.5l8-4.5" />
    <path d="M12 25.5" transform="scale(0 0)" />
  </svg>
);

export const IconSmartArt = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="6" height="6" rx="1" />
    <rect x="10" y="6" width="6" height="6" rx="1" />
    <rect x="17" y="6" width="4" height="6" rx="1" />
    <path d="M9 9h1m5 0h1M6 12v3a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-2" />
  </svg>
);

export const IconChart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <rect x="6.5" y="12" width="3" height="5" />
    <rect x="11" y="8" width="3" height="9" />
    <rect x="15.5" y="5" width="3" height="12" />
  </svg>
);

export const IconScreenshot = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="13" rx="1.5" />
    <path d="M9 9a2 2 0 1 0 0 0" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M6 18l4-4 3 3 3-3 3 3" />
  </svg>
);

export const IconHeader = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="1.5" />
    <path d="M3 9h18M9 9v12" />
  </svg>
);

export const IconFooter = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="1.5" />
    <path d="M3 15h18M9 3v12" />
  </svg>
);

export const IconPageNumber = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      1
    </text>
  </svg>
);

export const IconTextBox = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="14" rx="1" />
    <line x1="3" y1="4" x2="3" y2="11" />
    <path d="M12 18.5c.8.5 1.6.6 2.2.6 1.6 0 3-1 3-2.4 0-3.2-7.9-1.6-7.9-5.6 0-1.6 1.5-2.9 3.6-2.9 1 0 2 .3 3.1 1" />
  </svg>
);

export const IconQuickParts = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="8" y="13" width="8" height="8" rx="1" />
  </svg>
);

export const IconWordArt = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20l3.5-13a3 3 0 0 1 5.9 0L17 20" />
    <path d="M6 14h10" />
    <path d="M3.5 20" />
  </svg>
);

export const IconDropCap = (p: IconProps) => (
  <svg {...base(p)}>
    <text
      x="7.5"
      y="18"
      textAnchor="middle"
      fontFamily="Georgia, serif"
      fontSize="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      A
    </text>
    <line x1="11" y1="4" x2="20" y2="4" />
  </svg>
);

export const IconSignature = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 17c2-1.5 4-1.5 5.5.25 1 1.1 1.9 1.1 3 0 1.4-1.4 3-1.4 5.5.5" />
    <line x1="3" y1="20" x2="21" y2="20" />
    <line x1="5" y1="7" x2="5" y2="11" />
    <line x1="3" y1="9" x2="7" y2="9" />
  </svg>
);

export const IconDateTime = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
    <path d="M7 14h3l-2 4h4" />
  </svg>
);

export const IconObject = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <path d="M7 4v16M17 9h2M17 13h2M17 17h2M9 8h1M9 11h1M9 14h1" />
  </svg>
);

export const IconEquation = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8h4l-1-1.6c.6-.5 1.4-1.4 2.5-1.4 1.6 0 3 1.8 4.5 1.8.9 0 1.6-.4 2.2-.8M4 8l4 0m-4 0c0 1.6 1 2.6 2.2 3.4.9.6 1.8 1 2.3 2.1.5 1.1.5 2.4 1.5 3.2.7.6 1.4.9 2.2.9L10 8" />
  </svg>
);

export const IconSymbol = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 20a8 8 0 0 1 14 0" />
    <path d="M12 2v0" />
    <path d="M6.8 8.5a7.5 7.5 0 0 0-1.7 4.1" />
    <path d="M17.2 8.5a7.5 7.5 0 0 1 1.7 4.1" />
  </svg>
);

// ---------- Layout tab icons ----------

export const IconMargins = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <path d="M3 8h4M3 16h4" />
    <path d="M17 8h4M17 16h4" />
    <path d="M17 8v8" />
    <path d="M7 4v16" />
  </svg>
);

export const IconOrientation = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="13" height="18" rx="1" transform="rotate(0)" />
    <path d="M5 15h11" />
    <path d="M4 10.5h9" />
  </svg>
);

export const IconPageSize = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="18" rx="1" />
    <path d="M5 7h14M5 11h14M5 15h9" />
    <path d="M9 20v1h3" />
  </svg>
);

export const IconColumns = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="1" />
    <path d="M12 4v16" />
    <path d="M3 9h5M16 9h5M3 15h5M16 15h5" />
  </svg>
);

export const IconLayoutBreaks = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4v6.5M7 14v6" />
    <path d="M7 10.5h10l-2-2M17 12l-2 2" />
    <path d="M11 4h2M17 4h0" />
    <path d="M3 12v0" />
  </svg>
);

export const IconLineNumbers = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6h13M3 10h13M3 14h13M3 18h13" />
    <path d="M19 5l1 1-1.8 2h1.8" />
    <path d="M20 9v3M18.5 9H20c.8 0 1.5.7 1.5 1.5S20.8 12 20 12h-1.5" />
    <path d="M19 15l1.4 3" />
  </svg>
);

export const IconHyphenation = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 7h9" />
    <path d="M15 7h6" />
    <path d="M3 11h4M9 11h8" />
    <path d="M3 15h11" />
    <path d="M17 15h4" />
    <path d="M3 19h6" />
    <path d="M5 11l-1 4" />
  </svg>
);

export const IconLineSpacing = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5h9" />
    <path d="M12 9h9" />
    <path d="M12 19h9" />
    <path d="M12 15h9" />
    <path d="M8 4v16M5 7l3-3 3 3M5 17l3 3 3-3" />
  </svg>
);

export const IconPosition = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
  </svg>
);

export const IconWrapText = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8" y="6" width="8" height="8" rx="1" />
    <path d="M3 6h4M13 14h8" />
    <path d="M3 10h3.5M19 10h2" />
    <path d="M3 14h4M3 18h8M16 18h5" />
  </svg>
);

export const IconBringForward = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="12" width="9" height="9" rx="1" fill="currentColor" />
    <path d="M7 3h12a2 2 0 0 1 2 2v12" fill="none" />
  </svg>
);

export const IconSendBackward = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 7h12a2 2 0 0 1 2 2v12" fill="none" />
    <rect x="12" y="3" width="9" height="9" rx="1" fill="currentColor" />
  </svg>
);

export const IconSelectionPane = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="13" height="16" rx="1" />
    <path d="M19 6v4M22 8h-6" />
    <path d="M19 12v4M22 14h-6" />
    <path d="M5 8h6M5 12h6M5 16h6" />
  </svg>
);

export const IconAlignObjects = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="6" y="3" width="5" height="5" />
    <rect x="13" y="16" width="5" height="5" />
    <rect x="4" y="9" width="16" height="6" />
    <path d="M12 8v3M12 13v3" />
  </svg>
);

export const IconGroupObjects = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="8" width="9" height="9" rx="1" />
    <rect x="12" y="7" width="9" height="9" rx="1" />
    <path d="M8 20h4" />
  </svg>
);

export const IconRotate = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="5" width="14" height="14" rx="1" />
    <path d="M3 3l4 0 0 4" transform="rotate(0 0 0)" />
    <path d="M21 21h-4v-4" />
  </svg>
);

export const IconDialogLauncher = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 4h12a0 0 0 0 1 0 0v12" />
    <path d="M4 20V9" />
    <path d="M4 20h11" />
  </svg>
);

/* ---------- Review tab ---------- */

export const IconEditorSpelling = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 17l4-8 1-2.2a.4.4 0 0 1 .74 0L9.8 9l4 8" fill="none" />
    <path d="M5 12h6" fill="none" />
    <path d="M14 17l2-9.5L19 17M15.2 14.6h3.6" fill="none" />
    <path d="M21 5l-3 3-4-4 3-3z" />
  </svg>
);

export const IconThesaurus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20V8l6-4v12" />
    <path d="M10 8l6-4 4 10-6 4z" />
    <path d="M4 12l6-4" />
    <path d="M12 17l2 3 2-3" />
    <path d="M16 4l-2 3h4z" />
  </svg>
);

export const IconWordCount = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 15V9l-1.5 3M8 15l1.7-1.6" />
    <path d="M12 15V9.5M12 15l2.4-5.5L17 15M12.9 13h3.4" />
  </svg>
);

export const IconReadAloud = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16 9c1.2 1.3 1.2 4.7 0 6" />
    <path d="M18.5 6.5c2 2.1 2 6.9 0 9" />
  </svg>
);

export const IconAccessibility = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3a1.6 1.6 0 1 1 0 3.2A1.6 1.6 0 0 1 12 3z" />
    <path d="M5 6h14" />
    <path d="M12 6l-2.5 5-3 .5M12 6l2.5 5 3 .5M9.5 11.5l.8 3.5-2 4M14.5 11.5l-.8 3.5 2 4M9.5 15l2.5-.5 2.5.5" />
  </svg>
);

export const IconNewComment = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-3 3z" />
    <path d="M10 8h4M10 12h6" />
  </svg>
);

export const IconDeleteComment = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-3 3z" />
    <path d="M10 10l4 4M14 10l-4 4" />
  </svg>
);

export const IconPrevious = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 5l-6 7 6 7" />
  </svg>
);

export const IconNext = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 5l6 7-6 7" />
  </svg>
);

export const IconShowComments = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="11" height="6" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="12" y="13" width="7" height="6" rx="1" fill="currentColor" opacity="0.55" />
    <path d="M3 13l2.5 3M5.5 10.5L8 13" />
  </svg>
);

export const IconTrackChanges = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 15a5 5 0 0 1 5-5h8" />
    <path d="M16 8l3 2-3 2" />
    <path d="M19 15a5 5 0 0 1-5 5H6" />
    <path d="M8 22l-3-2 3-2" />
  </svg>
);

export const IconShowMarkup = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h9" />
    <path d="M4 6l2 2M4 6l2-2" />
    <path d="M4 12h12" />
    <path d="M4 12l2 2M4 12l2-2" />
    <path d="M4 18h15" />
    <path d="M4 18l2 2M4 18l2-2" />
  </svg>
);

export const IconReviewingPane = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="7" height="6" rx="1" fill="currentColor" opacity="0.9" />
    <rect x="3" y="14" width="7" height="4" rx="1" fill="currentColor" opacity="0.6" />
    <rect x="12" y="4" width="9" height="16" rx="1" />
  </svg>
);

export const IconAccept = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 10l3 3 6-7" />
    <rect x="4" y="16" width="16" height="4" rx="1" />
  </svg>
);

export const IconReject = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 8l6 6M14 8l-6 6" />
    <rect x="4" y="16" width="16" height="4" rx="1" />
  </svg>
);

export const IconCompare = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="13" height="16" rx="1" />
    <path d="M19 6v12" opacity="0.6" />
    <path d="M8 8h5M8 12h6M8 16h3" />
  </svg>
);

export const IconCombine = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5h9a3 3 0 0 1 3 3v11l-3-2" />
    <path d="M19 19H5" />
    <path d="M18 5c1.2 0 2 1 2 2.5S19.2 10 18 10s-2-1-2-2.5.8-2.5 2-2.5z" />
  </svg>
);

export const IconRestrictEditing = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="9" width="14" height="11" rx="1" />
    <path d="M9 9V7a3 3 0 0 1 6 0v2" />
    <path d="M12 13v3" />
  </svg>
);

export const IconMarkAsFinal = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="5" width="13" height="14" rx="1" />
    <path d="M9 10h5M9 14h3" />
    <path d="M20 6v12M22 8h-4M22 16h-4" />
  </svg>
);

export const IconTranslate = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5h9M8 3v2c0 3-1.4 5.5-3.6 7M4 12c2-1.2 3.6-3 4.6-5.4" />
    <path d="M12 5h8" />
    <path d="M18 3.5L15 12H8M14 8h6M17 8l-1.5 4" />
  </svg>
);

export const IconLanguage = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5h9M8 3v2c0 3.5-1.8 6.3-4.8 7.8" />
    <path d="M4 12c1.6-1.2 3-2.6 3.9-4.6" />
    <circle cx="15.5" cy="14" r="5" />
    <path d="M13 14h5M15.5 9.5c1 1.2 1.7 2.6 1.9 4.5M13 14c.8 2 2.2 3.4 4.4 4" />
  </svg>
);

export const IconInkPen = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 5l4 4-8.5 8.5L4 17l1-6.5z" />
    <path d="M13 7l4 4" />
  </svg>
);

export const IconInkText = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 16.5L7 7l2 9.5" />
    <path d="M6 13h2" />
    <path d="M12 7v9M12 7h5.5v9" />
    <path d="M7 5h11" opacity="0.7" />
  </svg>
);

export const IconInkShape = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 15l5-8 5 8z" fill="currentColor" opacity="0.85" />
    <rect x="12" y="4" width="8" height="8" rx="1" fill="currentColor" opacity="0.5" />
    <circle cx="6" cy="19" r="3" fill="currentColor" opacity="0.65" />
  </svg>
);

export const IconInkMath = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 7h4v10h4" />
    <path d="M5 12h6" />
    <path d="M17 9v6M14 12h6" />
  </svg>
);

/* ---------- Draw tab ---------- */

export const IconLasso = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6a5 5 0 0 1 5-3 5 5 0 0 1 5 3 4 4 0 0 1 4 5 5 5 0 0 1-1 4" />
    <path d="M17 13a4 4 0 1 0 3 6.5" />
    <path d="M17 16.5V21" />
    <circle cx="17" cy="18" r="1.3" fill="currentColor" />
  </svg>
);

export const IconEraser = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 21h12" />
    <path d="M8 21 3.6 16.6a2 2 0 0 1 0-2.9l8.4-8.4a2 2 0 0 1 2.9 0l5.3 5.3a2 2 0 0 1 0 2.9L15.4 20" />
    <path d="M10 5.6l5.3 5.3" />
  </svg>
);

export const IconPencil = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 4l1 1-9.5 9.5-3 .5.5-3z" />
    <path d="M15.5 6.5l2 2" />
    <path d="M4 20h16" />
  </svg>
);

export const IconPen = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 4.5l5.5 5.5" />
    <path d="M13 6l5 5" />
    <path d="M15 4l-8.5 8.5L5 16l3.5-.5L17 7z" />
  </svg>
);

export const IconHighlighter = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 13l3-3 5 5-3 3z" />
    <path d="M11 10l3-4 4 4-3 4" />
    <path d="M12 19l3 2 2-3-3-2z" />
    <path d="M5 20h6" />
  </svg>
);

export const IconInkReplay = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 0 3-6.2" />
    <path d="M4 4v3h3" />
    <path d="M12 8l2 2-2 2M12 14h3" />
  </svg>
);

export const IconInkConvert = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6a8 8 0 0 1 8-2" />
    <path d="M14 3l2 2-3 3" opacity="0.7" />
    <path d="M18 18a8 8 0 0 1-8 2" />
    <path d="M10 21l-2-2 3-3" opacity="0.7" />
    <path d="M8 12a5 5 0 0 1 10-1 4 4 0 0 1-5 5" fill="none" opacity="0.35" />
  </svg>
);

export const IconTouch = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9 11V6a1.5 1.5 0 0 1 3 0v4" />
    <path d="M12 9.5V5a1.5 1.5 0 0 1 3 0v5" />
    <path d="M15 10V8a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1a5 5 0 0 1-4.2-2.3L4.6 13a1.6 1.6 0 0 1 2.7-1.7L9 13.5" />
  </svg>
);

/* ---------- Design tab ---------- */

export const IconTheme = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
    <circle cx="9" cy="15" r="1" fill="currentColor" />
    <circle cx="15" cy="15" r="1" fill="currentColor" />
  </svg>
);

export const IconColors = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 8 8c0 1.4-1 2-2 2h-3a2 2 0 0 0-1.5 3.3c.6.7.5 1.7-.3 2.2" />
    <circle cx="8.5" cy="9.5" r="0.5" fill="currentColor" />
    <circle cx="14" cy="7" r="0.5" fill="currentColor" />
    <circle cx="17" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

export const IconFonts = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 17l4-10 3 9" />
    <path d="M6.5 12h4" />
    <path d="M14 17l3-9 3 9M15.5 12h3" />
  </svg>
);

export const IconSpacing = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 5h16" opacity="0.35" />
    <path d="M4 18h16M4 17h16" opacity="0.35" />
    <path d="M12 9v6" />
    <path d="M9 12h6" />
  </svg>
);

export const IconEffects = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" fill="none" />
    <path d="M12 12l6-4" />
    <path d="M12 2a10 10 0 1 0 10 10 3 3 0 0 1-6 0 6 6 0 0 0-6-6 3 3 0 0 1 0-6z" />
  </svg>
);

export const IconWatermark = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M12 7l2.5 10h-5z" opacity="0.55" />
    <path d="M10 13h4" opacity="0.55" />
  </svg>
);

export const IconPageColor = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" fill="currentColor" opacity="0.85" />
    <path d="M4 8h16" />
    <path d="M9 12h6M9 15h6" opacity="0.7" strokeWidth="1.2" />
  </svg>
);

export const IconPageBorder = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <rect x="7" y="6" width="10" height="12" rx="0.5" />
    <path d="M9.5 9h5M9.5 12h5" opacity="0.6" />
  </svg>
);

export const IconBorderLine = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 3h18M3 21h18M3 3v18M21 3v18" />
    <path d="M3 7h18M3 17h18" opacity="0.5" />
  </svg>
);

/* ---------- References tab ---------- */

export const IconToc = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="14" width="16" height="7" rx="1" />
    <path d="M3 3h12M3 7h9M3 11h13" />
    <path d="M17 3v6" />
  </svg>
);

export const IconUpdateTable = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12a8 8 0 1 0 3-6.2" />
    <path d="M4 4v3h3" />
    <path d="M11 7h6M8 11h9M8 15h6" />
  </svg>
);

export const IconAddText = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 10h16M4 14h16M4 18h16" opacity="0.5" />
    <path d="M4 6h6M4 10h4" />
    <circle cx="17" cy="10" r="3" />
    <path d="M17 8.5v3M15.5 10h3" />
  </svg>
);

export const IconFootnote = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 18l8-13 8 13" />
    <path d="M6.5 13h11" />
    <path d="M5 20h14" opacity="0.4" />
  </svg>
);

export const IconEndnote = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M9 8h6M9 8v7M9 8l1.6 1.8M9 8L7.4 9.8" />
  </svg>
);

export const IconCitation = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 4h16v13H8l-4 3z" opacity="0.5" />
    <path d="M7 9h10M7 12h7M7 15h4" />
  </svg>
);

export const IconManageSources = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M8 3v7l3-2 3 2V3" opacity="0.8" />
    <path d="M9 14h6M9 17h6" />
  </svg>
);

export const IconBibliography = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 4h16" />
    <path d="M4 9h13" />
    <path d="M4 14h10" />
    <rect x="13" y="14" width="7" height="7" rx="1" opacity="0.55" />
    <path d="M4 18h6" />
  </svg>
);

export const IconCaption = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="9" rx="1" opacity="0.6" />
    <path d="M4 17h16" />
    <path d="M4 20h8" />
  </svg>
);

export const IconTableOfFigures = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="7" height="5" rx="0.5" opacity="0.5" />
    <rect x="13" y="3" width="7" height="5" rx="0.5" opacity="0.5" />
    <path d="M4 21h16" />
    <path d="M7 12h10M7 16h8" />
  </svg>
);

export const IconCrossReference = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 10a5 5 0 0 1 7-4.6" />
    <path d="M19 14a5 5 0 0 1-7 4.6" />
    <path d="M7 13l3 3-3 3" />
    <path d="M10 16H6a2 2 0 0 1-2-2" opacity="0.6" />
  </svg>
);

export const IconMarkEntry = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="8" rx="1" />
    <path d="M4 15h16" />
    <path d="M4 19h9" />
    <path d="M17 14l3 6M17 20l3-6" />
  </svg>
);

export const IconIndex = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 5h14" />
    <path d="M5 10h10" />
    <path d="M5 15h13" />
    <path d="M5 19h8" />
    <path d="M18 13l3 3v-1" opacity="0.7" />
  </svg>
);

export const IconMarkCitation = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="1.5" />
    <path d="M8 6v12M16 6v12" />
  </svg>
);

export const IconTableOfAuthorities = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="1.5" opacity="0.55" />
    <path d="M12 3l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 10l6-1z" opacity="0.85" />
  </svg>
);

/* ---------- Mailings tab ---------- */

export const IconEnvelope = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="1.5" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);

export const IconLabels = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="8" height="5" rx="0.5" />
    <rect x="13" y="4" width="8" height="5" rx="0.5" />
    <rect x="3" y="11" width="8" height="5" rx="0.5" />
    <rect x="13" y="11" width="8" height="5" rx="0.5" />
    <rect x="3" y="18" width="8" height="2" rx="0.5" />
    <path d="M15 20v-5h4" />
  </svg>
);

export const IconMailMerge = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="1.5" />
    <path d="M4 7l8 6 8-6" />
    <path d="M17 16h4M17 19h3" />
  </svg>
);

export const IconRecipients = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 5a3 3 0 1 1 0 6M6 5a3 3 0 1 1 0 6" />
    <circle cx="6" cy="8" r="3" />
    <path d="M9 19a3 3 0 0 0-6 0" />
    <circle cx="16" cy="7" r="2.5" />
    <path d="M13.5 19a2.5 2.5 0 0 1 5 0" />
  </svg>
);

export const IconAddressBlock = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5h16" />
    <path d="M4 9h12" />
    <path d="M4 13h14" />
    <path d="M4 17h9" />
    <rect x="4" y="8" width="5" height="5" rx="0.5" opacity="0.3" />
  </svg>
);

export const IconGreetingLine = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 6c-1 2-.5 4 1 5 2 1.4 4 1 5 2.5M6.5 15c1-1 2.5-1.5 4-1" />
    <path d="M15 8h6M15 12h6M15 16h6" />
  </svg>
);

export const IconMergeField = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 18h16" />
    <path d="M8 18l4-12 4 12" opacity="0.85" />
    <path d="M8 18l4-12" opacity="0.4" />
  </svg>
);

export const IconHighlightFields = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 10V5h3M9 5h4" />
    <path d="M12 10V5M18 10V5h3" />
    <path d="M9 5h3" />
    <path d="M4 13h16" />
    <path d="M5 13l3 5h8l3-5" fill="currentColor" opacity="0.85" />
  </svg>
);

export const IconPreviewResults = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="11" r="7" />
    <path d="M17 17l4 4" />
    <circle cx="12" cy="11" r="2.5" fill="currentColor" />
  </svg>
);

export const IconFirstRecord = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M17 6v12M6 6v12" />
    <path d="M14 9v6" />
    <path d="M5 8l3 4-3 4M17 8l3 4-3 4" opacity="0.5" />
  </svg>
);

export const IconLastRecord = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 6v12M18 6v6" />
    <path d="M10 9v6" />
    <path d="M19 8l-3 4 3 4M7 8l-3 4 3 4" opacity="0.5" />
  </svg>
);

export const IconCheckErrors = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5" />
    <circle cx="12" cy="16" r="0.7" fill="currentColor" />
  </svg>
);

export const IconFinishMerge = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h16v12H4z" opacity="0.5" />
    <path d="M8 9l4 4-4 4M13 17h4" />
  </svg>
);

/* ---------- View tab ---------- */

export const IconPrintLayout = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M12 3v18" />
    <path d="M8 8h.01M8 12h.01M8 16h.01" />
  </svg>
);

export const IconWebLayout = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 4h16v16H4z" />
    <path d="M4 4h16v16H4z" />
    <path d="M4 9h16" />
    <path d="M9 9v11" />
  </svg>
);

export const IconOutlineView = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5h16M4 5h7" />
    <path d="M7 11h14M7 11h9" />
    <path d="M10 17h11" />
  </svg>
);

export const IconDraftView = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 4h14" />
    <path d="M5 9h14" />
    <path d="M5 14h14" />
    <path d="M5 19h8" />
    <path d="M16 17l2 2 3-3" opacity="0.7" />
  </svg>
);

export const IconReadMode = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 5h7v14H4zM13 5h7v14h-7z" />
    <path d="M7 9h.01M7 13h.01M16 9h.01M16 13h.01" />
  </svg>
);

export const IconRuler = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="7" width="18" height="10" rx="1.5" />
    <path d="M3 11h18" />
    <path d="M7 7v4M11 7v4M15 7v4M19 7v4" />
  </svg>
);

export const IconGridlines = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 3h18v18H3z" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
);

export const IconNavPane = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="7" height="16" rx="1" />
    <path d="M6 8h1M6 12h1M6 16h1" />
    <path d="M12 6h9M12 10h9M12 14h9M12 18h9" opacity="0.6" />
  </svg>
);

export const IconZoom = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.5-4.5" />
    <path d="M8 11h6M11 8v6" />
  </svg>
);

export const IconZoom100 = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.5-4.5" />
    <text x="11" y="14" textAnchor="middle" fontSize="7" strokeWidth="1.1" fill="none">100</text>
  </svg>
);

export const IconOnePage = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8" y="3" width="11" height="18" rx="1" />
    <path d="M4.5 8v11" />
  </svg>
);

export const IconMultiplePages = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="4" width="12" height="16" rx="1" />
    <rect x="12" y="2" width="12" height="16" rx="1" opacity="0.55" />
  </svg>
);

export const IconPageWidth = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="7" width="16" height="11" rx="1" />
    <path d="M4 10h.01M7 10h.01M10 10h.01M13 10h.01M16 10h.01M19 10h.01M4 15h.01" />
  </svg>
);

export const IconNewWindow = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
    <path d="M4 9h16M9 4v5" />
    <path d="M14 4v2" opacity="0.5" />
  </svg>
);

export const IconArrangeAll = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="10" height="7" rx="1" />
    <rect x="14" y="4" width="7" height="7" rx="1" opacity="0.55" />
    <rect x="3" y="13" width="7" height="7" rx="1" opacity="0.55" />
    <rect x="12" y="13" width="9" height="7" rx="1" />
  </svg>
);

export const IconSplit = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="9" rx="1" />
    <rect x="4" y="15" width="16" height="5" rx="1" />
    <path d="M9 8h6M9 18h6" opacity="0.5" />
  </svg>
);

export const IconSwitchWindows = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="6" width="9" height="7" rx="1" />
    <rect x="8" y="12" width="9" height="7" rx="1" opacity="0.55" />
    <path d="M6 20h3" />
  </svg>
);

export const IconMacros = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 2l2 4 4-2-2 4 4 2-4 2 2 4-4-2-2 4-2-4-4 2 2-4-4-2 4-2-2-4 4 2z" fill="currentColor" opacity="0.85" />
  </svg>
);

/* ---------- Help tab ---------- */

export const IconHelp = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.2 9a2.8 2.8 0 0 1 5.5 1c0 1.7-2.7 2.2-2.7 3.5" />
    <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
  </svg>
);

export const IconFeedback = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20a8 8 0 1 0-8-8c0 2 .8 3.9 2 5.3L5 20l3.9-1A8 8 0 0 0 12 20z" />
    <path d="M9 10h6M9 13h4" />
  </svg>
);

export const IconAbout = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <circle cx="12" cy="7.5" r="0.7" fill="currentColor" />
  </svg>
);

export const IconContact = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="13" rx="1.5" />
    <path d="M4 6l8 6 8-6" />
    <path d="M3 21h18" opacity="0.4" />
  </svg>
);

export const IconVoice = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8" y="3" width="8" height="12" rx="4" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <path d="M12 18v3M9 21h6" />
  </svg>
);

/* ---------- File (Backstage) icons ---------- */

export const IconNewFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
    <path d="M12 11v6M9 14h6" />
  </svg>
);

export const IconOpenFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M3 11h7.5" />
    <path d="M9 8.5 12 11l-3 2.5" />
  </svg>
);

export const IconSaveFile = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <path d="M17 21v-8H7v8M7 3v5h9" />
  </svg>
);

export const IconSaveAs = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11z" />
    <path d="M17 21v-8H7v8M7 3v5h9" />
    <path d="M19 10v4" />
  </svg>
);

export const IconPrint = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9V3h12v6" />
    <rect x="3" y="9" width="18" height="8" rx="1.5" />
    <path d="M6 15h12v6H6z" />
    <circle cx="17.5" cy="13" r="0.5" fill="currentColor" />
  </svg>
);

export const IconShare = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="18" cy="18" r="3" />
    <path d="M8.8 10.6l6.4-3.2M8.8 13.4l6.4 3.2" />
  </svg>
);

export const IconExport = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 15V3" />
    <path d="M7 7l5-4 5 4" />
    <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
  </svg>
);

export const IconCloseFile = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="13" height="18" rx="1.5" />
    <path d="M9 3v0" opacity="0" />
    <path d="M9 8l4 4M13 8l-4 4" />
    <path d="M17 12h3" />
  </svg>
);

export const IconAccount = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const IconOptions = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v10h13V10" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const IconPdf = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h3v4H8zM13 13h3v4h-3z" />
  </svg>
);

export const IconBackArrow = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);