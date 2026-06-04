import type { AuditOptions } from "./audit.js";
import type { DiscoveryDiagnostic } from "./discovery.js";
import type { ValidationIssue } from "./schema.js";
export interface DiscoveredWorkflow {
    name: string;
    sourcePath: string;
    triggers: unknown;
    permissions?: unknown;
    jobs: DiscoveredWorkflowJob[];
    uses: DiscoveredWorkflowUse[];
    runs: DiscoveredWorkflowRun[];
}
export interface DiscoveredWorkflowJob {
    id: string;
    permissions?: unknown;
    line?: number;
    permissionsLine?: number;
}
export interface DiscoveredWorkflowUse {
    value: string;
    path: string;
    jobId: string;
    line?: number;
}
export interface DiscoveredWorkflowRun {
    value: string;
    path: string;
    jobId: string;
    line?: number;
}
export interface WorkflowDiscoveryResult {
    workflows: DiscoveredWorkflow[];
    diagnostics: DiscoveryDiagnostic[];
}
/**
 * Discovers GitHub Actions workflow files from .github/workflows.
 *
 * @param cwd - Repository root.
 * @returns Workflow entries plus parse diagnostics.
 */
export declare function discoverGithubWorkflows(cwd: string): Promise<WorkflowDiscoveryResult>;
/**
 * Audits a GitHub Actions workflow for high-signal CI and token risks.
 *
 * @param workflow - Discovered workflow.
 * @param options - Audit strictness and policy options.
 * @returns Audit issues.
 */
export declare function auditGithubWorkflow(workflow: DiscoveredWorkflow, options?: AuditOptions): ValidationIssue[];
