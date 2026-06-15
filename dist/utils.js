import { access, realpath } from "node:fs/promises";
import path from "node:path";
export async function pathExists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function firstExistingPath(candidates) {
    for (const candidate of candidates) {
        if (await pathExists(candidate)) {
            return candidate;
        }
    }
    return undefined;
}
export function isSubpath(root, candidate) {
    const relative = path.relative(path.resolve(root), path.resolve(candidate));
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
export async function isRealSubpath(root, candidate) {
    if (!isSubpath(root, candidate)) {
        return false;
    }
    try {
        const [realRoot, realCandidate] = await Promise.all([realpath(root), realpath(candidate)]);
        return isSubpath(realRoot, realCandidate);
    }
    catch {
        return false;
    }
}
export function relativePathInside(root, candidate) {
    const relative = path.relative(path.resolve(root), path.resolve(candidate));
    return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
        ? relative
        : undefined;
}
export function skillLine(skill, field) {
    const sourceLines = skill.metadata.sourceLines;
    if (!sourceLines || typeof sourceLines !== "object" || Array.isArray(sourceLines)) {
        return undefined;
    }
    const line = sourceLines[field];
    return typeof line === "number" ? line : undefined;
}
export function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function countChar(value, target) {
    let count = 0;
    for (let index = 0; index < value.length; index += 1) {
        if (value[index] === target) {
            count += 1;
        }
    }
    return count;
}
export function normalizeRepoPath(filePath) {
    return filePath.replace(/\\/g, "/").replace(/^\.\//, "");
}
//# sourceMappingURL=utils.js.map