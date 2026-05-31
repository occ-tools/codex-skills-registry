import path from "node:path";
import type { ValidationIssue } from "./schema.js";

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
 * @returns SARIF log object.
 */
export function createSarifLog(issues: ValidationIssue[]): Record<string, unknown> {
  const rules = new Map<string, { id: string; name: string; shortDescription: { text: string } }>();
  const results: SarifResult[] = issues.map((issue) => {
    const ruleId = ruleIdForIssue(issue);
    if (!rules.has(ruleId)) {
      rules.set(ruleId, {
        id: ruleId,
        name: issue.path,
        shortDescription: {
          text: issue.path
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
                    uri: toSarifUri(file)
                  },
                  region: {
                    startLine: 1
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

function ruleIdForIssue(issue: ValidationIssue): string {
  return issue.path
    .replace(/^[A-Za-z]:[\\/]/, "")
    .replace(/[^A-Za-z0-9._-]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 120) || "registry.issue";
}

function issueFile(issue: ValidationIssue): string | undefined {
  const candidate = (issue as ValidationIssue & { file?: unknown }).file;
  return typeof candidate === "string" ? candidate : undefined;
}

function toSarifUri(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, "/");
}
