#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export function readNpmPackFilename(packJsonPath) {
    const parsed = JSON.parse(readFileSync(packJsonPath, "utf8"));
    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("npm pack JSON output is empty.");
    }
    const entry = parsed[0];
    if (typeof entry.filename !== "string" || entry.filename.length === 0) {
        throw new Error("npm pack JSON output does not contain a filename.");
    }
    return entry.filename;
}
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
    const packJsonPath = process.argv[2] ?? "npm-pack.json";
    try {
        console.log(readNpmPackFilename(packJsonPath));
    }
    catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    }
}
//# sourceMappingURL=npm-pack-output.js.map