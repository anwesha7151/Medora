#!/usr/bin/env node
/**
 * Codemod-style static check for the AppStoreProvider contract.
 *
 * 1. src/routes/__root.tsx must render <AppStoreProvider> around <Outlet />.
 * 2. No module reachable from a non-provider entry point (root shell/error/404
 *    components, server functions, API routes, MCP tools) may call useStore().
 *
 * Run: node scripts/check-store-provider.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const EXTS = [".tsx", ".ts", ".jsx", ".js"];
const errors = [];

/** ---- 1. Root wiring ---- */
const rootFile = join(SRC, "routes/__root.tsx");
const rootSrc = readFileSync(rootFile, "utf8");
const wraps =
  /<AppStoreProvider>[\s\S]*<Outlet\s*\/>[\s\S]*<\/AppStoreProvider>/.test(
    rootSrc,
  );
if (!wraps) {
  errors.push(
    'src/routes/__root.tsx must render <Outlet /> inside <AppStoreProvider> — otherwise every route throws "useStore must be used inside <AppStoreProvider>".',
  );
}

/** ---- 2. Reachability from non-provider entry points ---- */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (EXTS.some((e) => full.endsWith(e))) out.push(full);
  }
  return out;
}

const allFiles = walk(SRC);
const entryPoints = allFiles.filter(
  (f) =>
    /\.server\.[tj]sx?$/.test(f) ||
    /\.functions\.[tj]sx?$/.test(f) ||
    f.includes(join("routes", "api")) ||
    f.includes(join("lib", "mcp")),
);

function resolveImport(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = resolve(dirname(fromFile), spec);
  else return null;

  for (const ext of ["", ...EXTS, ...EXTS.map((e) => `/index${e}`)]) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const IMPORT_RE =
  /(?:import|export)[\s\S]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const seen = new Set();
const trail = new Map();

function visit(file, from) {
  if (seen.has(file)) return;
  seen.add(file);
  if (from) trail.set(file, from);

  const src = readFileSync(file, "utf8");
  if (/\buseStore\s*\(/.test(src) && !file.endsWith("store.tsx")) {
    const chain = [];
    let cur = file;
    while (cur) {
      chain.unshift(cur.replace(`${ROOT}/`, ""));
      cur = trail.get(cur);
    }
    errors.push(
      `useStore() is reachable outside <AppStoreProvider>: ${chain.join(" -> ")}`,
    );
  }

  for (const match of src.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2];
    if (!spec) continue;
    const target = resolveImport(file, spec);
    if (target) visit(target, file);
  }
}

for (const entry of entryPoints) visit(entry, null);

if (errors.length) {
  console.error("AppStoreProvider check failed:\n");
  for (const e of errors) console.error(`  • ${e}`);
  process.exit(1);
}

console.log(
  `AppStoreProvider check passed (root wiring OK, ${entryPoints.length} non-provider entry points clean).`,
);
