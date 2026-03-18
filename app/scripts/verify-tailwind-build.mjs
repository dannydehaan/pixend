import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist/assets");
const entries = await readdir(distDir);
const cssFile = entries.find((name) => name.endsWith(".css"));

if (!cssFile) {
  throw new Error("No CSS asset found in dist/assets — run `npm run build` first.");
}

const cssPath = path.join(distDir, cssFile);
const cssContent = await readFile(cssPath, "utf-8");
const expectedTokens = ["bg-background", "text-on-background", "border-primary"];
const missing = expectedTokens.filter((token) => !cssContent.includes(token));

if (missing.length) {
  throw new Error(
    `Tailwind build output is missing utility classes: ${missing.join(", ")}. ` +
      "Ensure the production CSS still contains the configured palette entries."
  );
}

console.log("Tailwind build verification passed: all sanity classes present.");
