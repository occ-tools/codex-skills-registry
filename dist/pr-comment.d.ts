import type { RegistryReport } from "./report.js";
export interface PullRequestCommentOptions {
    maxFindings?: number;
    suppressedCount?: number;
    baselineCount?: number;
    reportPath?: string;
    sarifPath?: string;
}
export declare function formatPullRequestComment(report: RegistryReport, options?: PullRequestCommentOptions): string;
