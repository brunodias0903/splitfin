import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = join(process.cwd(), "src");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return SOURCE_EXTENSIONS.has(extname(path)) && !path.includes(".test.") ? [path] : [];
  });
}

function resolveImport(importer: string, specifier: string): string | undefined {
  const base = specifier.startsWith("@/")
    ? join(SOURCE_ROOT, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(importer), specifier)
      : undefined;
  if (!base) return undefined;

  return [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find(
    existsSync,
  );
}

function internalDependencies(file: string): string[] {
  const content = readFileSync(file, "utf8");
  return [...content.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((match) => resolveImport(file, match[1]))
    .filter((dependency): dependency is string => Boolean(dependency));
}

describe("module boundaries", () => {
  const files = sourceFiles(SOURCE_ROOT);

  it("keeps domain and application layers independent from frameworks and persistence", () => {
    const forbidden = files
      .filter((file) => /\/modules\/[^/]+\/(domain|application)\//.test(file))
      .flatMap((file) => {
        const content = readFileSync(file, "utf8");
        return /from\s+["'](?:react|next(?:\/|["'])|.*\/ui(?:\/|["'])|.*\/infrastructure(?:\/|["']))/.test(
          content,
        )
          ? [relative(process.cwd(), file)]
          : [];
      });

    expect(forbidden).toEqual([]);
  });

  it("has no circular imports", () => {
    const graph = new Map(files.map((file) => [file, internalDependencies(file)]));
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const cycles: string[] = [];

    function visit(file: string, path: string[]) {
      if (visiting.has(file)) {
        cycles.push(
          [...path.slice(path.indexOf(file)), file]
            .map((item) => relative(SOURCE_ROOT, item))
            .join(" -> "),
        );
        return;
      }
      if (visited.has(file)) return;
      visiting.add(file);
      for (const dependency of graph.get(file) ?? []) visit(dependency, [...path, file]);
      visiting.delete(file);
      visited.add(file);
    }

    for (const file of files) visit(file, []);
    expect(cycles).toEqual([]);
  });
});
