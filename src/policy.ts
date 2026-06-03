import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { zodErrorToIssues, type ValidationIssue } from "./schema.js";

export const RegistryPolicyPresetSchema = z.enum(["recommended", "strict-mcp", "plugin-review"]);
export type RegistryPolicyPreset = z.infer<typeof RegistryPolicyPresetSchema>;

const PolicyExtendsSchema = z
  .union([RegistryPolicyPresetSchema, z.array(RegistryPolicyPresetSchema).min(1)])
  .optional();

/**
 * Repository policy file for maintainers who want stricter or project-specific
 * registry behavior in CI.
 */
export const RegistryPolicyInputSchema = z
  .object({
    extends: PolicyExtendsSchema,
    requirePinnedMcpPackages: z.boolean().optional(),
    allowedMcpCommands: z.array(z.string().min(1)).optional(),
    allowedRemoteMcpHosts: z.array(z.string().min(1)).optional(),
    requireExplicitMcpToolPolicy: z.boolean().optional(),
    requirePluginSkillPaths: z.boolean().optional(),
    failOnWarnings: z.boolean().optional()
  })
  .strict();

export const RegistryPolicySchema = RegistryPolicyInputSchema.omit({ extends: true })
  .extend({
    requirePinnedMcpPackages: z.boolean().default(false),
    requireExplicitMcpToolPolicy: z.boolean().default(false),
    requirePluginSkillPaths: z.boolean().default(false),
    failOnWarnings: z.boolean().default(false)
  })
  .strict();

export type RegistryPolicyInput = z.infer<typeof RegistryPolicyInputSchema>;
export type RegistryPolicy = z.infer<typeof RegistryPolicySchema>;

export interface LoadedPolicy {
  policy: RegistryPolicy;
  sourcePath?: string;
  diagnostics: ValidationIssue[];
}

export const DEFAULT_POLICY: RegistryPolicy = RegistryPolicySchema.parse({});

export const REGISTRY_POLICY_PRESETS: Record<RegistryPolicyPreset, RegistryPolicyInput> = {
  recommended: {
    requirePinnedMcpPackages: true,
    requireExplicitMcpToolPolicy: true,
    requirePluginSkillPaths: true,
    failOnWarnings: false
  },
  "strict-mcp": {
    requirePinnedMcpPackages: true,
    allowedMcpCommands: ["node", "python", "uvx"],
    requireExplicitMcpToolPolicy: true,
    failOnWarnings: true
  },
  "plugin-review": {
    requirePluginSkillPaths: true,
    requireExplicitMcpToolPolicy: true,
    failOnWarnings: false
  }
};

const POLICY_FILENAMES = [
  ".codex-skills-registry.yaml",
  ".codex-skills-registry.yml",
  ".codex-skills-registry.json"
];

/**
 * Loads a project policy file. When no policy is present, the permissive
 * default policy is returned.
 *
 * @param cwd - Project directory.
 * @param policyFile - Optional explicit policy file path.
 * @returns Loaded policy and validation diagnostics.
 */
export async function loadRegistryPolicy(
  cwd: string,
  policyFile?: string
): Promise<LoadedPolicy> {
  const candidates = policyFile
    ? [path.resolve(cwd, policyFile)]
    : POLICY_FILENAMES.map((filename) => path.join(cwd, filename));
  const sourcePath = await firstExistingPath(candidates);

  if (!sourcePath) {
    if (policyFile) {
      const resolvedPath = path.resolve(cwd, policyFile);
      return {
        policy: DEFAULT_POLICY,
        sourcePath: resolvedPath,
        diagnostics: [
          {
            severity: "error",
            path: resolvedPath,
            message: "Policy file does not exist."
          }
        ]
      };
    }

    return {
      policy: DEFAULT_POLICY,
      diagnostics: []
    };
  }

  try {
    const content = await readFile(sourcePath, "utf8");
    const parsed = sourcePath.endsWith(".json")
      ? (JSON.parse(content) as unknown)
      : (parseYaml(content) as unknown);
    const validation = RegistryPolicyInputSchema.safeParse(parsed);

    if (!validation.success) {
      return {
        policy: DEFAULT_POLICY,
        sourcePath,
        diagnostics: zodErrorToIssues(validation.error, sourcePath)
      };
    }

    return {
      policy: resolveRegistryPolicy(validation.data),
      sourcePath,
      diagnostics: []
    };
  } catch (error) {
    return {
      policy: DEFAULT_POLICY,
      sourcePath,
      diagnostics: [
        {
          severity: "error",
          path: sourcePath,
          message: error instanceof Error ? error.message : String(error)
        }
      ]
    };
  }
}

export function resolveRegistryPolicy(input: RegistryPolicyInput = {}): RegistryPolicy {
  const presetNames = normalizePolicyExtends(input.extends);
  const presetPolicy = presetNames.reduce<RegistryPolicyInput>(
    (merged, presetName) => ({
      ...merged,
      ...REGISTRY_POLICY_PRESETS[presetName]
    }),
    {}
  );
  const { extends: _extends, ...overrides } = input;

  return RegistryPolicySchema.parse({
    ...presetPolicy,
    ...removeUndefinedValues(overrides)
  });
}

export function formatRegistryPolicyYaml(policy: RegistryPolicyInput): string {
  const lines: string[] = [];

  if (policy.extends) {
    const presetNames = normalizePolicyExtends(policy.extends);
    lines.push("extends:");
    for (const presetName of presetNames) {
      lines.push(`  - ${presetName}`);
    }
  }

  appendBooleanPolicyLine(lines, "requirePinnedMcpPackages", policy.requirePinnedMcpPackages);
  appendStringListPolicyLines(lines, "allowedMcpCommands", policy.allowedMcpCommands);
  appendStringListPolicyLines(lines, "allowedRemoteMcpHosts", policy.allowedRemoteMcpHosts);
  appendBooleanPolicyLine(lines, "requireExplicitMcpToolPolicy", policy.requireExplicitMcpToolPolicy);
  appendBooleanPolicyLine(lines, "requirePluginSkillPaths", policy.requirePluginSkillPaths);
  appendBooleanPolicyLine(lines, "failOnWarnings", policy.failOnWarnings);

  return `${lines.join("\n")}\n`;
}

function normalizePolicyExtends(value: RegistryPolicyInput["extends"]): RegistryPolicyPreset[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function removeUndefinedValues<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, nestedValue]) => nestedValue !== undefined)) as Partial<T>;
}

function appendBooleanPolicyLine(lines: string[], key: string, value: boolean | undefined): void {
  if (typeof value === "boolean") {
    lines.push(`${key}: ${value}`);
  }
}

function appendStringListPolicyLines(
  lines: string[],
  key: string,
  value: string[] | undefined
): void {
  if (!value) {
    return;
  }

  lines.push(`${key}:`);
  for (const item of value) {
    lines.push(`  - ${item}`);
  }
}

async function firstExistingPath(candidates: string[]): Promise<string | undefined> {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Keep looking.
    }
  }

  return undefined;
}
