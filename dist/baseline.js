import { readFile } from "node:fs/promises";
import { z } from "zod";
import { resolvePathInside } from "./utils.js";
const IssueBaselineSchema = z.object({
    version: z.literal(1),
    generatedAt: z.string(),
    issues: z.array(z.object({
        fingerprint: z.string().min(1),
        code: z.string().min(1),
        path: z.string().min(1),
        file: z.string().optional(),
        message: z.string(),
    })),
});
export async function loadIssueBaselineFile(cwd, baselineFile) {
    if (!baselineFile) {
        return undefined;
    }
    const baselinePath = resolvePathInside(cwd, baselineFile, "baseline path");
    const parsed = JSON.parse(await readFile(baselinePath, "utf8"));
    return IssueBaselineSchema.parse(parsed);
}
//# sourceMappingURL=baseline.js.map