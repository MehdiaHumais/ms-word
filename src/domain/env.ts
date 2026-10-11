/**
 * Detect whether the app is running as an installed desktop-style app
 * (Electron / Tauri / an installed PWA in "standalone" mode) versus a plain
 * browser tab.
 *
 * The File button behaves like Word for the web in a plain browser tab
 * (dropdown menu) and like the Word 365 desktop app when installed
 * (full-screen backstage).
 *
 * You can force either mode in any environment for testing:
 *   http://localhost:5173/?desktop=1   → desktop backstage
 *   http://localhost:5173/?web=1       → browser dropdown
 */
export function isDesktopApp(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has("desktop")) return params.get("desktop") !== "0";
    if (params.get("web") === "1") return false;
  } catch {
    /* ignore malformed query */
  }

  // Tauri 2 injects window.__TAURI_INTERNALS__ into the webview before any
  // page script runs — the most reliable pre-render signal.
  if ((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) return true;

  const ua = navigator.userAgent ?? "";
  if (/Electron|Tauri/i.test(ua)) return true;

  if ((navigator as unknown as { standalone?: boolean }).standalone === true) return true;

  try {
    if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  } catch {
    /* matchMedia unavailable */
  }

  return false;
}