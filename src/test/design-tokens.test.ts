import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = join(process.cwd(), "src");
const COLOR_FILE = join(SOURCE_ROOT, "styles", "tokens", "colors.css");
const SOURCE_EXTENSIONS = new Set([".css", ".ts", ".tsx"]);
const RAW_COLOR = /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(/i;
const TAILWIND_PALETTE =
  /\b(?:bg|text|border|ring|from|via|to|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3})?(?:\/\d+)?\b/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return SOURCE_EXTENSIONS.has(extname(path)) ? [path] : [];
  });
}

describe("design-system colors", () => {
  it("keeps literal values and Tailwind palettes out of application files", () => {
    const violations = sourceFiles(SOURCE_ROOT)
      .filter((file) => file !== COLOR_FILE && !file.endsWith("design-tokens.test.ts"))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        return RAW_COLOR.test(content) || TAILWIND_PALETTE.test(content)
          ? [relative(process.cwd(), file)]
          : [];
      });

    expect(violations).toEqual([]);
  });
});
