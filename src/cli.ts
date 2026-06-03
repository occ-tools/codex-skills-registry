#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command, Option } from "commander";
import { executeMockSkill } from "./executor.js";
import {
  createRegistryJsonSchema,
  createRegistryJsonSchemaCatalog,
  isRegistryJsonSchemaName,
  listRegistryJsonSchemaNames
} from "./json-schema.js";
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
    .option("--no-examples", "exclude the examples/ skill roots under the project directory")
    .option("--format <format>", "output format: text, json, or sarif", "text")
    .option("--github-annotations", "emit GitHub Actions annotations for diagnostics")
    .addOption(new Option("--list", "legacy flag: list registered skills").hideHelp())
    .addOption(new Option("--validate", "legacy flag: validate a skill named by --name").hideHelp())
    .addOption(new Option("--name <skillName>", "skill name for --validate").hideHelp())
    .addOption(new Option("--run <skillName>", "legacy flag: mock-run a skill").hideHelp())
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

  program
    .command("schema")
    .description("export JSON Schema for supported registry files")
    .argument("[schema]", `single schema to export: ${listRegistryJsonSchemaNames().join(", ")}`)
    .option("-o, --out <file>", "output file; prints to stdout when omitted")
    .option(
      "--schema <schema>",
      `single schema to export: ${listRegistryJsonSchemaNames().join(", ")}`
    )
    .action(
      async (
        schema: string | undefined,
        options: { out?: string; schema?: string },
        command: Command
      ) => {
        if (schema && options.schema && schema !== options.schema) {
          throw new Error("Use either the schema argument or --schema; both values must not differ.");
        }

        await handleSchema(toLoadOptions(command.parent?.opts() ?? {}), {
          out: options.out,
          schema: schema ?? options.schema
        });
      }
    );

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
    const diagnostics = registry.listDiagnostics();
    const issues = resultList.flatMap((result) => result.issues);
    const allIssues = [...diagnostics, ...issues];
    const hasErrors =
      resultList.some((result) => !result.valid) ||
      diagnostics.some((issue) => issue.severity === "error");

    if (outputOptions.githubAnnotations) {
      emitGithubAnnotations(allIssues, options.cwd);
    }

    if (outputOptions.format === "sarif") {
      writeJson(createSarifLog(allIssues, { cwd: options.cwd }));
    } else if (outputOptions.format === "json") {
      writeJson({ diagnostics, results: resultList });
    } else {
      if (diagnostics.length > 0) {
        console.log("Diagnostics:");
        console.log(formatValidationIssues(diagnostics, { cwd: options.cwd }));
      }

      if (resultList.length === 0 && diagnostics.length === 0) {
        console.log("No registered skills to validate.");
      }

      for (const result of resultList) {
        console.log(`${result.name}: ${result.valid ? "valid" : "invalid"}`);
        if (result.issues.length > 0) {
          console.log(formatValidationIssues(result.issues, { cwd: options.cwd }));
        }
      }
    }

    if (hasErrors) {
      process.exitCode = 1;
    }
    return;
  }

  const result = await registry.validateSkillByName(name);
  const diagnostics = registry.listDiagnostics();
  const allIssues = [...diagnostics, ...result.issues];

  if (outputOptions.githubAnnotations) {
    emitGithubAnnotations(allIssues, options.cwd);
  }

  if (outputOptions.format === "sarif") {
    writeJson(createSarifLog(allIssues, { cwd: options.cwd }));
  } else if (outputOptions.format === "json") {
    writeJson({ name, ...result, diagnostics });
  } else {
    if (diagnostics.length > 0) {
      console.log("Diagnostics:");
      console.log(formatValidationIssues(diagnostics, { cwd: options.cwd }));
    }

    console.log(`${name}: ${result.valid ? "valid" : "invalid"}`);
    console.log(formatValidationIssues(result.issues, { cwd: options.cwd }));
  }

  if (!result.valid || diagnostics.some((issue) => issue.severity === "error")) {
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
    emitGithubAnnotations(allIssues, options.cwd);
  }

  if (outputOptions.format === "sarif") {
    writeJson(createSarifLog(allIssues, { cwd: options.cwd }));
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
      console.log(formatValidationIssues(diagnostics, { cwd: options.cwd }));
    }

    if (validationIssues.length > 0) {
      console.log("\nValidation:");
      console.log(formatValidationIssues(validationIssues, { cwd: options.cwd }));
    }

    if (auditIssues.length > 0) {
      console.log("\nAudit:");
      console.log(formatValidationIssues(auditIssues, { cwd: options.cwd }));
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
  const diagnostics = registry.listDiagnostics();
  const auditIssues = registry.audit({ strict: auditOptions.strict });
  const issues = [...diagnostics, ...auditIssues];

  if (outputOptions.githubAnnotations) {
    emitGithubAnnotations(issues, options.cwd);
  }

  if (outputOptions.format === "sarif") {
    writeJson(createSarifLog(issues, { cwd: options.cwd }));
  } else if (outputOptions.format === "json") {
    writeJson({
      diagnostics,
      issues: auditIssues,
      policy: registry.getPolicy(),
      policyPath: registry.getPolicyPath()
    });
  } else {
    if (diagnostics.length > 0) {
      console.log("Diagnostics:");
      console.log(formatValidationIssues(diagnostics, { cwd: options.cwd }));
    }

    if (auditIssues.length > 0) {
      if (diagnostics.length > 0) {
        console.log("\nAudit:");
      }
      console.log(formatValidationIssues(auditIssues, { cwd: options.cwd }));
    } else if (diagnostics.length === 0) {
      console.log(formatValidationIssues(auditIssues, { cwd: options.cwd }));
    }
  }

  if (shouldFail(issues, registry.getPolicy())) {
    process.exitCode = 1;
  }
}

async function handleExport(options: CliLoadOptions, outFile?: string): Promise<void> {
  const registry = await SkillsRegistry.load(options);
  const json = `${JSON.stringify(registry.toIndex({ relativePaths: true }), null, 2)}\n`;

  if (!outFile) {
    console.log(json);
    return;
  }

  const outputPath = path.resolve(options.cwd ?? process.cwd(), outFile);
  await writeFile(outputPath, json, "utf8");
  console.log(`Exported registry index to ${outputPath}`);
}

async function handleSchema(
  options: CliLoadOptions,
  schemaOptions: { out?: string; schema?: string }
): Promise<void> {
  const schema = schemaOptions.schema
    ? createNamedJsonSchema(schemaOptions.schema)
    : createRegistryJsonSchemaCatalog();
  const json = `${JSON.stringify(schema, null, 2)}\n`;

  if (!schemaOptions.out) {
    console.log(json);
    return;
  }

  const outputPath = path.resolve(options.cwd ?? process.cwd(), schemaOptions.out);
  await writeFile(outputPath, json, "utf8");
  console.log(`Exported JSON Schema to ${outputPath}`);
}

function createNamedJsonSchema(name: string): Record<string, unknown> {
  if (!isRegistryJsonSchemaName(name)) {
    throw new Error(
      `Unknown schema '${name}'. Supported schemas are: ${listRegistryJsonSchemaNames().join(", ")}.`
    );
  }

  return createRegistryJsonSchema(name);
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

function emitGithubAnnotations(issues: ValidationIssue[], cwd?: string): void {
  for (const issue of issues) {
    const command = issue.severity === "error" ? "error" : "warning";
    const file = issueFile(issue, cwd);
    const line = issueLine(issue);
    const properties = [
      file ? `file=${escapeAnnotationProperty(file)}` : undefined,
      line ? `line=${line}` : undefined,
      `title=${escapeAnnotationProperty(issueTitle(issue, cwd))}`
    ].filter(Boolean);
    console.error(
      `::${command} ${properties.join(",")}::${escapeAnnotationMessage(issue.message)}`
    );
  }
}

function issueFile(issue: ValidationIssue, cwd?: string): string | undefined {
  const candidate = issue.file;
  if (typeof candidate !== "string") {
    return undefined;
  }

  if (cwd && path.isAbsolute(candidate)) {
    const relative = path.relative(path.resolve(cwd), path.resolve(candidate));
    if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
      return relative.replace(/\\/g, "/");
    }
  }

  return candidate.replace(/\\/g, "/");
}

function issueLine(issue: ValidationIssue): number | undefined {
  return typeof issue.line === "number" && Number.isInteger(issue.line) && issue.line > 0
    ? issue.line
    : undefined;
}

function issueTitle(issue: ValidationIssue, cwd?: string): string {
  if (!issue.file || !cwd || !path.isAbsolute(issue.file)) {
    return issue.path.replace(/\\/g, "/");
  }

  const relative = path.relative(path.resolve(cwd), path.resolve(issue.file));
  if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
    return issue.path.replace(issue.file, relative.replace(/\\/g, "/"));
  }

  return issue.path.replace(/\\/g, "/");
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
