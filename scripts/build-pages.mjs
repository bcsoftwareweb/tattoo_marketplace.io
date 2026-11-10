import { spawnSync } from "node:child_process";
import fs from "node:fs";
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
fs.rmSync(docsDir, { recursive: true, force: true });
fs.cpSync(outDir, docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, ".nojekyll"), "");
console.log("GitHub Pages files written to /docs");
