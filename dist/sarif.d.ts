import type { ValidationIssue } from "./schema.js";
export interface SarifOptions {
    cwd?: string;
}
/**
 * Converts registry validation and audit issues to a SARIF 2.1.0 log. SARIF
 * output lets GitHub Code Scanning and similar tools ingest registry findings
 * without parsing terminal text.
 *
 * @param issues - Registry issues to convert.
 * @param options - Output options such as repository root path.
 * @returns SARIF log object.
 */
export declare function createSarifLog(issues: ValidationIssue[], options?: SarifOptions): Record<string, unknown>;
