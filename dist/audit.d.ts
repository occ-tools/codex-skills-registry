import type { DiscoveredMcpServer } from "./discovery.js";
import type { RegistryPolicy } from "./policy.js";
import type { CodexSkill, ValidationIssue } from "./schema.js";
export interface AuditInput {
    skills: CodexSkill[];
    mcpServers: DiscoveredMcpServer[];
}
export interface AuditOptions {
    strict?: boolean;
    policy?: RegistryPolicy;
}
/**
 * Runs registry-level safety checks that complement schema validation. These
 * checks are intentionally conservative and focus on review visibility rather
 * than blocking every possible risk by default.
 *
 * @param input - Registry assets to audit.
 * @param options - Audit strictness options.
 * @returns Audit issues.
 */
export declare function auditRegistry(input: AuditInput, options?: AuditOptions): ValidationIssue[];
/**
 * Audits a single Codex Skill entry for path and metadata risks.
 *
 * @param skill - Skill to audit.
 * @param options - Audit strictness options.
 * @returns Audit issues.
 */
export declare function auditSkill(skill: CodexSkill, options?: AuditOptions): ValidationIssue[];
/**
 * Audits a discovered MCP server for approval policy, auth, and command risk.
 *
 * @param server - MCP server entry.
 * @param options - Audit strictness options.
 * @returns Audit issues.
 */
export declare function auditMcpServer(server: DiscoveredMcpServer, options?: AuditOptions): ValidationIssue[];
