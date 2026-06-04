#!/usr/bin/env node
export interface ActionIssueSummary {
    issueCount: number;
    errorCount: number;
    warningCount: number;
    suppressedCount: number;
    baselineCount: number;
}
export declare function summarizeCliJson(data: unknown): ActionIssueSummary;
export declare function writeGithubOutputSummary(summary: ActionIssueSummary, outputPath?: string | undefined): void;
export declare function writeGithubOutputSummaryFromFile(summaryFile: string, outputPath?: string | undefined): void;
