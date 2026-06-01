#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { executeMockSkill } from "./executor.js";
import type { RegistryPolicy } from "./policy.js";
import { SkillsRegistry, formatValidationIssues, type RegistryLoadOptions } from "./registry.js";
import { createSarifLog } from "./sarif.js";
import { TriggerTypeSchema, type TriggerType, type ValidationIssue } from "./schema.js";

const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json") as { version: string };

interface CliLoadOptions extends RegistryLoadOptions {
  examples?: boolean;
}

type OutputFormat = "text" | "json" | "sarif";

interface CliOutputOptions {
  format: OutputFormat;
  githubAnnotations: boolean;
}

const DEFAULT_OUTPUT_OPTIONS: CliOutputOptions = {
  format: "text",
  githubAnnotations: false
};

/**
 * Runs the codex-skills CLI.
 *
 * @param argv - Process argv vector.
 */
export async function runCli(argv = process.argv): Promise<void> {
  const program = new Command();

  program
    .name("codex-skills")
    .description("Validate, index, and mock-run Codex Skills, plugins, and MCP configs.")
    .version(VERSION)
    .option("-C, --cwd <dir>", "project directory to inspect", process.cwd())
    .option("--config <file>", "JSON/YAML file containing additional skill records")
    .option("--policy <file>", "YAML/JSON registry policy file")
    .option("--no-examples", "exclude bundled example skills")
    .option("--format <format>", "output format: text, json, or sarif", "text")
    .option("--github-annotations", "emit GitHub Actions annotations for diagnostics")
    .option("--list", "legacy flag: list registered skills")
    .option("--validate", "legacy flag: validate a skill named by --name")
    .option("--name <skillName>", "skill name for --validate")
    .option("--run <skillName>", "legacy flag: mock-run a skill")
    .action(async (options: Record<string, unknown>) => {
      const loadOptions = toLoadOptions(options);
      const outputOptions = toOutputOptions(options);

      if (options.list) {
        await handleList(loadOptions, outputOptions);
        return;
      }

      if (options.validate) {
        await handleValidate(String(options.name ?? ""), loadOptions, outputOptions);
        return;
      }

      if (typeof options.run === "string") {
        await handleRun(options.run, loadOptions, {}, outputOptions);
        return;
      }

      program.outputHelp();
    });

  program
    .command("list")
    .description("list registered skills")
    .action(async () => {
      const parentOptions = program.opts();
      await handleList(toLoadOptions(parentOptions), toOutputOptions(parentOptions));
    });

  program
    .command("validate")
    .description("validate one skill or every registered skill")
    .argument("[name]", "skill name")
    .option("--name <skillName>", "skill name")
    .action(async (name: string | undefined, options: { name?: string }, command: Command) => {
      const parentOptions = command.parent?.opts() ?? {};
      await handleValidate(
        name ?? options.name ?? "",
        toLoadOptions(parentOptions),
        toOutputOptions(parentOptions)
      );
    });

  program
    .command("run")
    .description("mock-run a registered skill")
    .argument("<name>", "skill name")
    .option("--trigger <type>", "mock trigger type")
    .option("--repo <owner/name>", "mock repository", "example/repository")
    .action(
      async (
        name: string,
        options: { trigger?: string; repo: string },
        command: Command
      ) => {
        const parentOptions = command.parent?.opts() ?? {};
        const trigger = parseOptionalTrigger(options.trigger);
        await handleRun(
          name,
          toLoadOptions(parentOptions),
          {
            trigger,
            repository: options.repo
          },
          toOutputOptions(parentOptions)
        );
      }
    );

  program
    .command("doctor")
    .description("validate registry contents and summarize MCP/plugin discovery")
    .option("--strict", "treat selected audit warnings as errors")
    .action(async (options: { strict?: boolean }, command: Command) => {
      const parentOptions = command.parent?.opts() ?? {};
      await handleDoctor(toLoadOptions(parentOptions), options, toOutputOptions(parentOptions));
    });

  program
    .command("audit")
    .description("run safety checks for registered skills and MCP servers")
    .option("--strict", "treat selected audit warnings as errors")
    .action(async (options: { strict?: boolean }, command: Command) => {
      const parentOptions = command.parent?.opts() ?? {};
      await handleAudit(toLoadOptions(parentOptions), options, toOutputOptions(parentOptions));
    });

  program
    .command("export")
    .description("export registry index as JSON")
    .option("-o, --out <file>", "output file; prints to stdout when omitted")
    .action(async (options: { out?: string }, command: Command) => {
      await handleExport(toLoadOptions(command.parent?.opts() ?? {}), options.out);
    });

  await program.parseAsync(argv);
}

async function handleList(
  options: CliLoadOptions,
  outputOptions: CliOutputOptions = DEFAULT_OUTPUT_OPTIONS
): Promise<void> {
  const registry = await SkillsRegistry.load(options);
  if (outputOptions.format === "json") {
    writeJson({
      skills: registry.listSkills(),
      diagnostics: registry.listDiagnostics()
    });
    return;
  }
  rejectSarifFor("list", outputOptions);

  console.log(registry.formatSkillsTable());
}

async function handleValidate(
  name: string,
  options: CliLoadOptions,
  outputOptions: CliOutputOptions = DEFAULT_OUTPUT_OPTIONS
): Promise<void> {
  const registry = await SkillsRegistry.load(options);

  if (!name) {
    const results = await registry.validateAllSkills();
    const resultList = [...results.entries()].map(([skillName, result]) => ({
      name: skillName,
      ...result
    }));
    const issues = resultList.flatMap((result) => result.issues);
    const hasErrors = resultList.some((result) => !result.valid);

    if (outputOptions.githubAnnotations) {
      emitGithubAnnotations(issues);
    }

    if (outputOptions.format === "sarif") {
      writeJson(createSarifLog(issues));
    } else if (outputOptions.format === "json") {
      writeJson({ results: resultList });
    } else {
      for (const result of resultList) {
        console.log(`${result.name}: ${result.valid ? "valid" : "invalid"}`);
        if (result.issues.length > 0) {
          console.log(formatValidationIssues(result.issues));
        }
      }
    }

    if (hasErrors) {
      process.exitCode = 1;
    }
    return;
  }

  const result = await registry.validateSkillByName(name);

  if (outputOptions.githubAnnotations) {
    emitGithubAnnotations(result.issues);
  }

  if (outputOptions.format === "sarif") {
    writeJson(createSarifLog(result.issues));
  } else if (outputOptions.format === "json") {
    writeJson({ name, ...result });
  } else {
    console.log(`${name}: ${result.valid ? "valid" : "invalid"}`);
    console.log(formatValidationIssues(result.issues));
  }

  if (!result.valid) {
    process.exitCode = 1;
  }
}

async function handleRun(
  name: string,
  options: CliLoadOptions,
  executionOptions: { trigger?: TriggerType; repository?: string } = {},
  outputOptions: CliOutputOptions = DEFAULT_OUTPUT_OPTIONS
): Promise<void> {
  const registry = await SkillsRegistry.load(options);
  const result = await executeMockSkill(registry, name, executionOptions);

  if (outputOptions.format === "json") {
    writeJson(result);
    return;
  }
  rejectSarifFor("run", outputOptions);

  console.log(result.logs.join("\n"));
}

async function handleDoctor(
  options: CliLoadOptions,
  doctorOptions: { strict?: boolean } = {},
  outputOptions: CliOutputOptions = DEFAULT_OUTPUT_OPTIONS
): Promise<void> {
  const registry = await SkillsRegistry.load(options);
  const validationResults = await registry.validateAllSkills();
  const validationIssues = [...validationResults.entries()].flatMap(([skillName, result]) =>
    result.issues.map((issue) => ({
      ...issue,
      path: issue.path === skillName ? issue.path : `${skillName}.${issue.path}`
    }))
  );
  const invalid = [...validationResults.values()].filter((result) => !result.valid);
  const diagnostics = registry.listDiagnostics();
  const auditIssues = registry.audit({ strict: doctorOptions.strict });
  const allIssues = [...diagnostics, ...validationIssues, ...auditIssues];
  const report = {
    summary: {
      skills: registry.listSkills().length,
      invalidSkills: invalid.length,
      mcpServers: registry.listMcpServers().length,
      plugins: registry.listPlugins().length,
      auditIssues: auditIssues.length
    },
    policy: registry.getPolicy(),
    policyPath: registry.getPolicyPath(),
    diagnostics,
    validationIssues,
    auditIssues
  };

  if (outputOptions.githubAnnotations) {
    emitGithubAnnotations(allIssues);
  }

  if (outputOptions.format === "sarif") {
    writeJson(createSarifLog(allIssues));
  } else if (outputOptions.format === "json") {
    writeJson(report);
  } else {
    console.log(`Skills: ${report.summary.skills} registered, ${report.summary.invalidSkills} invalid`);
    console.log(`MCP servers: ${report.summary.mcpServers} discovered`);
    console.log(`Plugins: ${report.summary.plugins} discovered`);
    console.log(
      `Audit: ${report.summary.auditIssues} issue${report.summary.auditIssues === 1 ? "" : "s"} found`
    );

    if (diagnostics.length > 0) {
      console.log("\nDiagnostics:");
      console.log(formatValidationIssues(diagnostics));
    }

    if (validationIssues.length > 0) {
      console.log("\nValidation:");
      console.log(formatValidationIssues(validationIssues));
    }

    if (auditIssues.length > 0) {
      console.log("\nAudit:");
      console.log(formatValidationIssues(auditIssues));
    }
  }

  if (shouldFail(allIssues, registry.getPolicy())) {
    process.exitCode = 1;
  }
}

async function handleAudit(
  options: CliLoadOptions,
  auditOptions: { strict?: boolean } = {},
  outputOptions: CliOutputOptions = DEFAULT_OUTPUT_OPTIONS
): Promise<void> {
  const registry = await SkillsRegistry.load(options);
  const issues = registry.audit({ strict: auditOptions.strict });

  if (outputOptions.githubAnnotations) {
    emitGithubAnnotations(issues);
  }

  if (outputOptions.format === "sarif") {
    writeJson(createSarifLog(issues));
  } else if (outputOptions.format === "json") {
    writeJson({
      issues,
      policy: registry.getPolicy(),
      policyPath: registry.getPolicyPath()
    });
  } else {
    console.log(formatValidationIssues(issues));
  }

  if (shouldFail(issues, registry.getPolicy())) {
    process.exitCode = 1;
  }
}

async function handleExport(options: CliLoadOptions, outFile?: string): Promise<void> {
  const registry = await SkillsRegistry.load(options);
  const json = `${JSON.stringify(registry.toIndex(), null, 2)}\n`;

  if (!outFile) {
    console.log(json);
    return;
  }

  const outputPath = path.resolve(options.cwd ?? process.cwd(), outFile);
  await writeFile(outputPath, json, "utf8");
  console.log(`Exported registry index to ${outputPath}`);
}

function toLoadOptions(options: Record<string, unknown>): CliLoadOptions {
  return {
    cwd: typeof options.cwd === "string" ? options.cwd : process.cwd(),
    configFile: typeof options.config === "string" ? options.config : undefined,
    policyFile: typeof options.policy === "string" ? options.policy : undefined,
    includeExamples: options.examples !== false
  };
}

function toOutputOptions(options: Record<string, unknown>): CliOutputOptions {
  const format = typeof options.format === "string" ? options.format : "text";
  if (format !== "text" && format !== "json" && format !== "sarif") {
    throw new Error("Supported output formats are 'text', 'json', and 'sarif'.");
  }

  return {
    format,
    githubAnnotations: options.githubAnnotations === true
  };
}

function writeJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function rejectSarifFor(command: string, outputOptions: CliOutputOptions): void {
  if (outputOptions.format === "sarif") {
    throw new Error(`SARIF output is not supported for '${command}'. Use doctor, audit, or validate.`);
  }
}

function shouldFail(issues: ValidationIssue[], policy: RegistryPolicy): boolean {
  return issues.some((issue) => issue.severity === "error") || (policy.failOnWarnings && issues.length > 0);
}

function emitGithubAnnotations(issues: ValidationIssue[]): void {
  for (const issue of issues) {
    const command = issue.severity === "error" ? "error" : "warning";
    const file = issueFile(issue);
    const properties = [
      file ? `file=${escapeAnnotationProperty(file)}` : undefined,
      `title=${escapeAnnotationProperty(issue.path)}`
    ].filter(Boolean);
    console.error(
      `::${command} ${properties.join(",")}::${escapeAnnotationMessage(issue.message)}`
    );
  }
}

function issueFile(issue: ValidationIssue): string | undefined {
  const candidate = (issue as ValidationIssue & { file?: unknown }).file;
  return typeof candidate === "string" ? candidate : undefined;
}

function escapeAnnotationProperty(value: string): string {
  return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/,/g, "%2C");
}

function escapeAnnotationMessage(value: string): string {
  return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

function parseOptionalTrigger(value: string | undefined): TriggerType | undefined {
  if (!value) {
    return undefined;
  }

  return TriggerTypeSchema.parse(value);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
