// Lovable's shared TanStack config already includes these plugins — do not re-add them
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

export default defineConfig({
  ssrErrorLogger: false,
  serverFnErrorLogger: false,
  nitro: {
    preset: "node-server",
  },
  vite: {
    plugins: process.platform === "win32" ? [] : [mcpPlugin()],
  },
});
