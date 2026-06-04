import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listRegistryRules } from "../src/rules.js";

describe("rules catalog", () => {
  it("contains one explanation for every emitted issue code", async () => {
    const emittedCodes = await collectEmittedIssueCodes(path.join(process.cwd(), "src"));
    const ruleCodes = listRegistryRules().map((rule) => rule.code);
    const missingCodes = [...emittedCodes].filter((code) => !ruleCodes.includes(code));

    expect(new Set(ruleCodes).size).toBe(ruleCodes.length);
    expect(missingCodes).toEqual([]);
  });
});

async function collectEmittedIssueCodes(root: string): Promise<Set<string>> {
  const codes = new Set<string>();
  const files = await collectSourceFiles(root);

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const match of content.matchAll(/code:\s*["']([A-Z0-9_]+)["']/g)) {
      codes.add(match[1] ?? "");
    }
  }

  codes.delete("");
  return codes;
}

async function collectSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)));
    } else if (entry.name.endsWith(".ts")) {
      files.push(entryPath);
    }
  }

  return files;
}
