import { access, realpath } from "node:fs/promises";
import path from "node:path";
import type { CodexSkill } from "./schema.js";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function firstExistingPath(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function isSubpath(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export async function isRealSubpath(root: string, candidate: string): Promise<boolean> {
  if (!isSubpath(root, candidate)) {
    return false;
  }

  try {
    const [realRoot, realCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
    return isSubpath(realRoot, realCandidate);
  } catch {
    return false;
  }
}

export function relativePathInside(root: string, candidate: string): string | undefined {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative
    : undefined;
}

export function skillLine(skill: CodexSkill, field: string): number | undefined {
  const sourceLines = skill.metadata.sourceLines;
  if (!sourceLines || typeof sourceLines !== "object" || Array.isArray(sourceLines)) {
    return undefined;
  }

  const line = (sourceLines as Record<string, unknown>)[field];
  return typeof line === "number" ? line : undefined;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function countChar(value: string, target: string): number {
  let count = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === target) {
      count += 1;
    }
  }

  return count;
}

export function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}
