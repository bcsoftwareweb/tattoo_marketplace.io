import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, GITHUB_PAGES: "true" },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const outDir = path.join(root, "out");
const docsDir = path.join(root, "docs");

// Next asks for segment payloads as one dotted filename
// (`__next.!group.styles.__PAGE__.txt`). On Windows the exporter keeps the
// backslashes, so those files land in nested folders and every prefetch 404s.
function flattenSegmentFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("__next.")) {
      writeFlatSegments(dir, full);
      continue;
    }
    flattenSegmentFiles(full);
  }
}

function writeFlatSegments(routeDir, segmentRoot) {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  };
  walk(segmentRoot);
  for (const file of files) {
    const flatName = path.relative(routeDir, file).split(path.sep).join(".");
    const dest = path.join(routeDir, flatName);
    if (dest !== file) fs.copyFileSync(file, dest);
  }
}

flattenSegmentFiles(outDir);

// Hashed files under /_next/static stay valid for any HTML a browser or the
// Pages CDN still has open. Wiping them makes that cached document 404 its CSS.
const previousStatic = path.join(docsDir, "_next", "static");
const staticBackup = path.join(os.tmpdir(), "blackline-pages-static");
fs.rmSync(staticBackup, { recursive: true, force: true });
if (fs.existsSync(previousStatic)) fs.cpSync(previousStatic, staticBackup, { recursive: true });

fs.rmSync(docsDir, { recursive: true, force: true });
fs.cpSync(outDir, docsDir, { recursive: true });
if (fs.existsSync(staticBackup)) {
  copyMissing(staticBackup, path.join(docsDir, "_next", "static"));
  fs.rmSync(staticBackup, { recursive: true, force: true });
}
fs.writeFileSync(path.join(docsDir, ".nojekyll"), "");
console.log("GitHub Pages files written to /docs");

function copyMissing(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyMissing(src, dest);
      continue;
    }
    if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  }
}
