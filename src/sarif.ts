import path from "node:path";
import type { ValidationIssue } from "./schema.js";

export interface SarifOptions {
  cwd?: string;
}

interface SarifResult {
  ruleId: string;
  level: "error" | "warning" | "note";
  message: {
    text: string;
  };
  locations?: Array<{
    physicalLocation: {
      artifactLocation: {
        uri: string;
      };
      region: {
        startLine: number;
      };
    };
  }>;
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
export function createSarifLog(
  issues: ValidationIssue[],
  options: SarifOptions = {}
): Record<string, unknown> {
  const rules = new Map<string, { id: string; name: string; shortDescription: { text: string } }>();
  const results: SarifResult[] = issues.map((issue) => {
    const ruleName = ruleNameForIssue(issue, options.cwd);
    const ruleId = ruleIdForIssue(ruleName);
    if (!rules.has(ruleId)) {
      rules.set(ruleId, {
        id: ruleId,
        name: ruleName,
        shortDescription: {
          text: ruleName
        }
      });
    }

    const file = issueFile(issue);
    return {
      ruleId,
      level: issue.severity === "error" ? "error" : "warning",
      message: {
        text: issue.message
      },
      ...(file
        ? {
            locations: [
              {
                  physicalLocation: {
                    artifactLocation: {
                    uri: toSarifUri(file, options.cwd)
                  },
                  region: {
                    startLine: issueLine(issue)
                  }
                }
              }
            ]
          }
        : {})
    };
  });

  return {
    version: "2.1.0",
    $schema:
      "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "codex-skills-registry",
            rules: [...rules.values()]
          }
        },
        results
      }
    ]
  };
}

function ruleNameForIssue(issue: ValidationIssue, cwd?: string): string {
  if (!issue.file || !cwd || !path.isAbsolute(issue.file)) {
    return issue.path;
  }

  const relativeFile = relativePathInside(path.resolve(cwd), path.resolve(issue.file));
  return relativeFile ? issue.path.replace(issue.file, relativeFile.replace(/\\/g, "/")) : issue.path;
}

function ruleIdForIssue(ruleName: string): string {
  return ruleName
    .replace(/^[A-Za-z]:[\\/]/, "")
    .replace(/[^A-Za-z0-9._-]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 120) || "registry.issue";
}

function issueFile(issue: ValidationIssue): string | undefined {
  const candidate = issue.file;
  return typeof candidate === "string" ? candidate : undefined;
}

function issueLine(issue: ValidationIssue): number {
  return typeof issue.line === "number" && Number.isInteger(issue.line) && issue.line > 0
    ? issue.line
    : 1;
}

function toSarifUri(filePath: string, cwd?: string): string {
  if (cwd && path.isAbsolute(filePath)) {
    const relative = relativePathInside(path.resolve(cwd), path.resolve(filePath));
    if (relative) {
      return relative.replace(/\\/g, "/");
    }
  }

  return path.normalize(filePath).replace(/\\/g, "/");
}

function relativePathInside(root: string, candidate: string): string | undefined {
  const relative = path.relative(root, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? relative : undefined;
}
