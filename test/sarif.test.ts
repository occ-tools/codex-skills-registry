import path from "node:path";
import { describe, expect, it } from "vitest";
import { createSarifLog } from "../src/sarif.js";

describe("sarif", () => {
  it("uses issue file, line, and repository-relative URI when available", () => {
    const cwd = path.join(process.cwd(), "test", "fixtures", "invalid-project");
    const file = path.join(cwd, ".codex", "config.toml");
    const log = createSarifLog(
      [
        {
          severity: "warning",
          path: "mcp_servers.shell.command",
          file,
          line: 3,
          message: "Shell command requires review.",
        },
      ],
      { cwd },
    ) as {
      runs: Array<{
        results: Array<{
          locations: Array<{
            physicalLocation: {
              artifactLocation: { uri: string };
              region: { startLine: number };
            };
          }>;
        }>;
      }>;
    };

    const location = log.runs[0]?.results[0]?.locations[0]?.physicalLocation;

    expect(location?.artifactLocation.uri).toBe(".codex/config.toml");
    expect(location?.region.startLine).toBe(3);
  });

  it("normalizes absolute file paths in SARIF rule metadata", () => {
    const cwd = path.join(process.cwd(), "test", "fixtures", "invalid-project");
    const file = path.join(cwd, ".agents", "skills", "bad-skill", "SKILL.md");
    const log = createSarifLog(
      [
        {
          severity: "error",
          path: `${file}.name`,
          file,
          message: "Invalid skill name.",
        },
      ],
      { cwd },
    ) as {
      runs: Array<{
        tool: {
          driver: {
            rules: Array<{
              id: string;
              name: string;
            }>;
          };
        };
      }>;
    };

    const rule = log.runs[0]?.tool.driver.rules[0];

    expect(rule?.name).toBe(".agents/skills/bad-skill/SKILL.md.name");
    expect(rule?.id).toBe("agents.skills.bad-skill.SKILL.md.name");
  });
});
