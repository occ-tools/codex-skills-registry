import { z } from "zod";
import { type ValidationIssue } from "./schema.js";
export declare const RegistryPolicyPresetSchema: z.ZodEnum<{
    recommended: "recommended";
    "strict-mcp": "strict-mcp";
    "plugin-review": "plugin-review";
}>;
export type RegistryPolicyPreset = z.infer<typeof RegistryPolicyPresetSchema>;
/**
 * Repository policy file for maintainers who want stricter or project-specific
 * registry behavior in CI.
 */
export declare const RegistryPolicyInputSchema: z.ZodObject<{
    extends: z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
        recommended: "recommended";
        "strict-mcp": "strict-mcp";
        "plugin-review": "plugin-review";
    }>, z.ZodArray<z.ZodEnum<{
        recommended: "recommended";
        "strict-mcp": "strict-mcp";
        "plugin-review": "plugin-review";
    }>>]>>;
    requirePinnedMcpPackages: z.ZodOptional<z.ZodBoolean>;
    allowedSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedPlugins: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedPlugins: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedMcpServers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedMcpServers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedMcpCommands: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedMcpCommands: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedRemoteMcpHosts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedRemoteMcpHosts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requireExplicitMcpToolPolicy: z.ZodOptional<z.ZodBoolean>;
    requirePluginSkillPaths: z.ZodOptional<z.ZodBoolean>;
    failOnWarnings: z.ZodOptional<z.ZodBoolean>;
    baselineFile: z.ZodOptional<z.ZodString>;
    suppressions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        file: z.ZodOptional<z.ZodString>;
        reason: z.ZodString;
        owner: z.ZodOptional<z.ZodString>;
        expiresOn: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export declare const RegistryPolicySchema: z.ZodObject<{
    allowedSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedPlugins: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedPlugins: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedMcpServers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedMcpServers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedMcpCommands: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedMcpCommands: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedRemoteMcpHosts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deniedRemoteMcpHosts: z.ZodOptional<z.ZodArray<z.ZodString>>;
    baselineFile: z.ZodOptional<z.ZodString>;
    requirePinnedMcpPackages: z.ZodDefault<z.ZodBoolean>;
    requireExplicitMcpToolPolicy: z.ZodDefault<z.ZodBoolean>;
    requirePluginSkillPaths: z.ZodDefault<z.ZodBoolean>;
    failOnWarnings: z.ZodDefault<z.ZodBoolean>;
    suppressions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        code: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        file: z.ZodOptional<z.ZodString>;
        reason: z.ZodString;
        owner: z.ZodOptional<z.ZodString>;
        expiresOn: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
}, z.core.$strict>;
export type RegistryPolicyInput = z.infer<typeof RegistryPolicyInputSchema>;
export type RegistryPolicy = z.infer<typeof RegistryPolicySchema>;
export interface LoadedPolicy {
    policy: RegistryPolicy;
    sourcePath?: string;
    diagnostics: ValidationIssue[];
}
export declare const DEFAULT_POLICY: RegistryPolicy;
export declare const REGISTRY_POLICY_PRESETS: Record<RegistryPolicyPreset, RegistryPolicyInput>;
/**
 * Loads a project policy file. When no policy is present, the permissive
 * default policy is returned.
 *
 * @param cwd - Project directory.
 * @param policyFile - Optional explicit policy file path.
 * @returns Loaded policy and validation diagnostics.
 */
export declare function loadRegistryPolicy(cwd: string, policyFile?: string): Promise<LoadedPolicy>;
export declare function resolveRegistryPolicy(input?: RegistryPolicyInput): RegistryPolicy;
export declare function formatRegistryPolicyYaml(policy: RegistryPolicyInput): string;
