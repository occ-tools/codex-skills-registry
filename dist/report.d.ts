import type { ValidationIssue } from "./schema.js";
import type { RegistryIndex } from "./registry.js";
export interface RegistryReportSummary {
    skills: number;
    mcpServers: number;
    plugins: number;
    errors: number;
    warnings: number;
}
export interface RegistryReport {
    summary: RegistryReportSummary;
    skills: Array<{
        name: string;
        triggers: string[];
        source: string;
        description: string;
    }>;
    mcpServers: Array<{
        name: string;
        sourcePath: string;
        transport: "stdio" | "http";
    }>;
    plugins: Array<{
        name: string;
        sourcePath: string;
    }>;
    issues: ValidationIssue[];
    nextActions: string[];
}
/**
 * Creates a maintainer-facing report from a registry index.
 *
 * @param index - Registry snapshot, preferably with project-relative paths.
 * @returns Structured report data.
 */
export declare function createRegistryReport(index: RegistryIndex): RegistryReport;
/**
 * Formats a registry report as Markdown for CI artifacts, pull requests, or
 * generated repository documentation.
 *
 * @param report - Report data.
 * @returns Markdown report.
 */
export declare function formatRegistryReportMarkdown(report: RegistryReport): string;
export declare function formatRegistryReportHtml(report: RegistryReport): string;
