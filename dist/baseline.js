import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
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
    const baselinePath = path.resolve(cwd, baselineFile);
    const parsed = JSON.parse(await readFile(baselinePath, "utf8"));
    return IssueBaselineSchema.parse(parsed);
}
//# sourceMappingURL=baseline.js.map