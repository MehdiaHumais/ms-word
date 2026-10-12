import type { CSSProperties } from "react";

/**
 * Document themes for the Design tab. A theme is a colour palette plus a
 * heading/body font pair, mirroring how Word applies a theme across a
 * document. Themes are applied live via CSS custom properties on the page
 * (see `themeVars`) so they recolour headings, links and body text without
 * mutating the document's stored marks.
 */
export interface ThemeDef {
  id: string;
  name: string;
  /** Six accent colours (Accent 1–6). */
  colors: string[];
  headingFont: string;
  bodyFont: string;
}

export const THEMES: ThemeDef[] = [
  { id: "office", name: "Office", colors: ["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"], headingFont: "Calibri Light", bodyFont: "Calibri" },
  { id: "gallery", name: "Gallery", colors: ["#7030a0", "#c00000", "#2e75b6", "#548235", "#bf9000", "#7030a0"], headingFont: "Georgia", bodyFont: "Verdana" },
  { id: "contemporary", name: "Contemporary", colors: ["#ed6c47", "#4a6572", "#c9a66b", "#8a5a44", "#727e7e", "#2e7d8c"], headingFont: "Segoe UI", bodyFont: "Segoe UI" },
  { id: "paper", name: "Paper", colors: ["#7f7f7f", "#2e2e2e", "#a62b3c", "#4e7c8a", "#b09b67", "#6b8e5a"], headingFont: "Palatino", bodyFont: "Garamond" },
  { id: "doctor", name: "Doctor", colors: ["#4472c4", "#c55a11", "#9ec5e8", "#d9d9d9", "#ed7d31", "#70ad47"], headingFont: "Arial", bodyFont: "Arial Narrow" },
];

export const DEFAULT_THEME_ID = "office";

/** Look up a theme by id, falling back to the default theme. */
export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

/** Parse `#rgb` / `#rrggbb` into an [r, g, b] tuple. */
export function parseHex(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (h.length !== 6 || Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => clampByte(v).toString(16).padStart(2, "0")).join("");
}

/** Darken a hex colour by `amount` (0 = unchanged, 1 = black). */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const f = 1 - Math.max(0, Math.min(1, amount));
  return toHex(r * f, g * f, b * f);
}

function fontStack(name: string): string {
  return `"${name}", "Segoe UI", sans-serif`;
}

/**
 * CSS custom properties that turn a theme into live document styling. Applied
 * on the page element; `.brit-content` rules consume them with sensible
 * fallbacks so the app still renders if a variable is missing.
 */
export function themeVars(theme: ThemeDef): CSSProperties {
  const accent = theme.colors[0] ?? "#4472c4";
  return {
    "--brit-heading-color": darken(accent, 0.4),
    "--brit-link-color": accent,
    "--brit-heading-font": fontStack(theme.headingFont),
    "--brit-body-font": fontStack(theme.bodyFont),
  } as CSSProperties;
}
