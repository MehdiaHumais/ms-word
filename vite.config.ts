import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    // Bind IPv4 loopback explicitly: Vite's default "localhost" can resolve to
    // [::1] only on Windows, while Tauri's devUrl is http://127.0.0.1:5173.
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    pool: "threads",
  },
});