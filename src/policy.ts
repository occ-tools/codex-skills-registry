import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { zodErrorToIssues, type ValidationIssue } from "./schema.js";

/**
 * Repository policy file for maintainers who want stricter or project-specific
 * registry behavior in CI.
 */
export const RegistryPolicySchema = z
  .object({
    requirePinnedMcpPackages: z.boolean().default(false),
    allowedMcpCommands: z.array(z.string().min(1)).optional(),
    allowedRemoteMcpHosts: z.array(z.string().min(1)).optional(),
    requireExplicitMcpToolPolicy: z.boolean().default(false),
    requirePluginSkillPaths: z.boolean().default(false),
    failOnWarnings: z.boolean().default(false)
  })
  .strict();

export type RegistryPolicy = z.infer<typeof RegistryPolicySchema>;

export interface LoadedPolicy {
  policy: RegistryPolicy;
  sourcePath?: string;
  diagnostics: ValidationIssue[];
}

export const DEFAULT_POLICY: RegistryPolicy = RegistryPolicySchema.parse({});

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
    const validation = RegistryPolicySchema.safeParse(parsed);

    if (!validation.success) {
      return {
        policy: DEFAULT_POLICY,
        sourcePath,
        diagnostics: zodErrorToIssues(validation.error, sourcePath)
      };
    }

    return {
      policy: validation.data,
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
