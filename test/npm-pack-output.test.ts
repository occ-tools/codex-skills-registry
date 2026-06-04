import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readNpmPackFilename } from "../src/npm-pack-output.js";

describe("npm pack output", () => {
  it("reads the tarball filename from npm pack JSON", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-pack-"));
    const packJson = path.join(tmp, "npm-pack.json");

    try {
      await writeFile(packJson, JSON.stringify([{ filename: "package-0.1.0.tgz" }]), "utf8");

      expect(readNpmPackFilename(packJson)).toBe("package-0.1.0.tgz");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("rejects malformed npm pack JSON", async () => {
    const tmp = await mkdtemp(path.join(tmpdir(), "codex-skills-pack-"));
    const packJson = path.join(tmp, "npm-pack.json");

    try {
      await writeFile(packJson, JSON.stringify([{}]), "utf8");

      expect(() => readNpmPackFilename(packJson)).toThrow("filename");
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
