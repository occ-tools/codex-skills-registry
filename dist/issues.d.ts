import type { RegistryPolicy } from "./policy.js";
import type { ValidationIssue } from "./schema.js";
export interface IssueBaselineEntry {
    fingerprint: string;
    code: string;
    path: string;
    file?: string;
    message: string;
}
export interface IssueBaseline {
    version: 1;
    generatedAt: string;
    issues: IssueBaselineEntry[];
}
export interface IssueFilterResult {
    activeIssues: ValidationIssue[];
    suppressedIssues: ValidationIssue[];
    baselineIssues: ValidationIssue[];
}
export declare function createIssueBaseline(issues: ValidationIssue[], options?: {
    cwd?: string;
}): IssueBaseline;
export declare function applyIssuePolicyFilters(issues: ValidationIssue[], options: {
    policy: RegistryPolicy;
    cwd?: string;
    baseline?: IssueBaseline;
    today?: Date;
}): IssueFilterResult;
export declare function issueCode(issue: ValidationIssue): string;
export declare function issueFingerprint(issue: ValidationIssue, options?: {
    cwd?: string;
}): string;
export declare function displayIssueFile(issue: ValidationIssue, cwd?: string): string | undefined;
