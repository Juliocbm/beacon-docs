import { cac } from "cac";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runInit, runInitInteractive } from "./commands/init";
import type { AgentId } from "./core/config";
import { ADDON_CATEGORIES, type ProjectType } from "./core/project-types";
import type { ExistingFileAction } from "./core/existing-files";
import { renderLogo } from "./ui/logo";
import { c } from "./ui/colors";
import { CHECK, CROSS, WARN, ARROW } from "./ui/glyphs";
import { closestMatch } from "./ui/suggest";
import { renderRuleExplain, listAllRules, getAllRuleNames } from "./linter/rule-docs";
import { renderCheckExplain, listAllChecks, getAllCheckNames } from "./doctor/check-docs";
import { renderPluginExplain, getPluginNames } from "./plugins/explain";
import type { LoadedPlugin } from "./plugins/types";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.join(here, "..", "package.json"), "utf8"),
) as { version: string };

// Global error handler: turn any uncaught error into a clean colored
// `✗ Error: <message>` line and exit 1, instead of letting Node print a
// stack trace. Set BEACON_DEBUG=1 to also print the stack for debugging.
function handleCliError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${CROSS} ${c.bold("Error:")} ${message}`);
  if (process.env.BEACON_DEBUG && err instanceof Error && err.stack) {
    console.error(c.dim(err.stack));
  }
  process.exit(1);
}

process.on("unhandledRejection", handleCliError);
process.on("uncaughtException", handleCliError);

const cli = cac("beacon");

cli
  .command("init", "Initialize Beacon docs convention in this project")
  .option("--yes", "Run non-interactively")
  .option("--type <type>", "Project type (web-app, backend-service, library, cli-tool, mobile-app, monorepo, custom)")
  .option("--with <categories>", "Categories to add beyond defaults (comma-separated)")
  .option("--without <categories>", "Categories to remove from defaults (comma-separated)")
  .option("--agents <agents>", "AI agents to support (comma-separated: claude,cursor,codex,gemini)")
  .option("--language <lang>", "Docs language", { default: "en" })
  .action(async (opts) => {
    const root = process.cwd();
    if (opts.yes) {
      if (!opts.type) {
        console.error(`${CROSS} ${c.bold("Error:")} --type is required when using --yes.`);
        process.exit(1);
      }
      await runInit({
        root,
        yes: true,
        type: opts.type as ProjectType,
        with: splitList(opts.with),
        without: splitList(opts.without),
        agents: (splitList(opts.agents) as AgentId[]).length
          ? (splitList(opts.agents) as AgentId[])
          : ["claude", "cursor"],
        language: opts.language ?? "en",
        existingFiles: "replace" as ExistingFileAction,
      });
      console.log(`${CHECK} Beacon docs scaffolded at ${c.dim(`${root}/docs/`)}`);
      console.log(c.dim(`  ${ARROW} Next: \`beacon new plan <slug>\` to create your first plan`));
    } else {
      await runInitInteractive({ root });
    }
  });

cli
  .command("sync", "Regenerate AI rule files from docs/_meta/convention.md")
  .action(async () => {
    const { runSync } = await import("./commands/sync");
    await runSync({ root: process.cwd() });
    console.log(`${CHECK} AI rule files regenerated.`);
  });

cli
  .command("new <type> <slug>", "Create a new doc with correct location and naming")
  .option("--category <cat>", "Disambiguate for `guide` (integrations|operations)")
  .action(async (type, slug, opts) => {
    const { runNew } = await import("./commands/new");
    const today = new Date().toISOString().slice(0, 10);
    const file = await runNew({
      root: process.cwd(),
      type, slug, today,
      category: opts.category,
    });
    console.log(`${CHECK} Created ${c.dim(path.relative(process.cwd(), file))}`);
  });

cli
  .command("archive <type> <slug>", "Move a completed plan or roadmap to _archive/")
  .option("--force", "Archive even if unchecked TODOs remain")
  .action(async (type, slug, opts) => {
    const { runArchive } = await import("./commands/archive");
    const result = await runArchive({
      root: process.cwd(),
      type, slug, force: !!opts.force,
    });
    if (result.warnings.length) {
      for (const w of result.warnings) console.warn(`${WARN} ${c.yellow(w)}`);
    }
    console.log(`${CHECK} Archived to ${c.dim(path.relative(process.cwd(), result.destination))}`);
  });

cli
  .command("enable <addon>", "Enable an add-on category")
  .action(async (addon) => {
    const { runEnable } = await import("./commands/toggle");
    await runEnable({ root: process.cwd(), addon });
    console.log(`${CHECK} Enabled ${c.cyan(addon)}.`);
  });

cli
  .command("disable <addon>", "Disable an add-on category")
  .option("--force", "Disable even if the folder has documents")
  .action(async (addon, opts) => {
    const { runDisable } = await import("./commands/toggle");
    await runDisable({ root: process.cwd(), addon, force: !!opts.force });
    console.log(`${CHECK} Disabled ${c.cyan(addon)}.`);
  });

cli
  .command("about", "Show version, install location, project config, and AI-file status")
  .action(async () => {
    const { runAboutCommand } = await import("./commands/about");
    const result = await runAboutCommand({
      root: process.cwd(),
      version: pkg.version,
      installPath: fileURLToPath(import.meta.url),
    });
    process.stdout.write(result.output);
    if (!result.output.endsWith("\n")) process.stdout.write("\n");
    process.exit(result.exitCode);
  });

cli
  .command("completion <shell>", "Print a shell completion script (bash, zsh, or fish)")
  .action(async (shell: string) => {
    const { runCompletionCommand } = await import("./commands/completion");
    const result = runCompletionCommand({ shell });
    if (result.isError) {
      console.error(`${CROSS} ${c.bold("Error:")} ${result.output.trimEnd()}`);
    } else {
      process.stdout.write(result.output);
    }
    process.exit(result.exitCode);
  });

/**
 * Best-effort plugin load for the `--explain` handlers. Returns an empty list
 * when there is no beacon.config.json in the current directory — `--explain`
 * must work in any directory, including ones without a project.
 */
async function loadPluginsSafely(): Promise<LoadedPlugin[]> {
  try {
    const { readConfig } = await import("./core/config");
    const { loadPlugins } = await import("./plugins/loader");
    const config = await readConfig(process.cwd());
    const result = await loadPlugins({
      root: process.cwd(),
      sources: config.plugins ?? [],
    });
    return result.plugins;
  } catch {
    return [];
  }
}

cli
  .command("doctor", "Surface docs-tree health signals (stale plans, proposed ADRs, etc.)")
  .option("--strict", "Exit with code 1 if any findings exist")
  .option("--json", "Emit JSON output")
  .option("--explain [check]", "Explain a doctor check (or list all checks if no name given)")
  .action(async (opts) => {
    if (opts.explain !== undefined) {
      if (opts.explain === true || opts.explain === "") {
        process.stdout.write(listAllChecks() + "\n");
        process.exit(0);
      }
      const builtin = renderCheckExplain(String(opts.explain));
      if (builtin) {
        process.stdout.write(builtin + "\n");
        process.exit(0);
      }
      // Fall through to plugin-contributed checks.
      const plugins = await loadPluginsSafely();
      const pluginExplain = renderPluginExplain(String(opts.explain), "check", plugins);
      if (pluginExplain) {
        process.stdout.write(pluginExplain + "\n");
        process.exit(0);
      }
      const allNames = [...getAllCheckNames(), ...getPluginNames(plugins, "check")];
      const suggestion = closestMatch(String(opts.explain), allNames);
      const hint = suggestion ? ` Did you mean ${c.cyan(suggestion)}?` : "";
      console.error(`${CROSS} ${c.bold("Error:")} Unknown check "${opts.explain}".${hint}`);
      console.error(c.dim(`Run \`beacon doctor --explain\` to list all checks.`));
      process.exit(1);
    }
    const { runDoctorCommand } = await import("./commands/doctor");
    const result = await runDoctorCommand({
      root: process.cwd(),
      strict: !!opts.strict,
      json: !!opts.json,
    });
    for (const line of result.pluginErrors) console.error(line);
    process.stdout.write(result.output);
    if (!opts.json && !result.output.endsWith("\n")) process.stdout.write("\n");
    process.exit(result.exitCode);
  });

cli
  .command("lint", "Validate the docs tree against the convention")
  .option("--strict", "Escalate warnings to errors")
  .option("--json", "Emit JSON output")
  .option("--explain [rule]", "Explain a lint rule (or list all rules if no name given)")
  .action(async (opts) => {
    if (opts.explain !== undefined) {
      if (opts.explain === true || opts.explain === "") {
        process.stdout.write(listAllRules() + "\n");
        process.exit(0);
      }
      const builtin = renderRuleExplain(String(opts.explain));
      if (builtin) {
        process.stdout.write(builtin + "\n");
        process.exit(0);
      }
      // Fall through to plugin-contributed rules.
      const plugins = await loadPluginsSafely();
      const pluginExplain = renderPluginExplain(String(opts.explain), "rule", plugins);
      if (pluginExplain) {
        process.stdout.write(pluginExplain + "\n");
        process.exit(0);
      }
      const allNames = [...getAllRuleNames(), ...getPluginNames(plugins, "rule")];
      const suggestion = closestMatch(String(opts.explain), allNames);
      const hint = suggestion ? ` Did you mean ${c.cyan(suggestion)}?` : "";
      console.error(`${CROSS} ${c.bold("Error:")} Unknown rule "${opts.explain}".${hint}`);
      console.error(c.dim(`Run \`beacon lint --explain\` to list all rules.`));
      process.exit(1);
    }
    const { runLintCommand } = await import("./commands/lint");
    const result = await runLintCommand({
      root: process.cwd(),
      strict: !!opts.strict,
      json: !!opts.json,
    });
    for (const line of result.pluginErrors) console.error(line);
    process.stdout.write(result.output);
    if (!opts.json && !result.output.endsWith("\n")) process.stdout.write("\n");
    process.exit(result.exitCode);
  });

// Build a custom help string with groups
function renderHelp(): string {
  const lines: string[] = [];
  lines.push(renderLogo(pkg.version));
  lines.push(`${c.bold("Usage:")}`);
  lines.push(`  beacon ${c.cyan("<command>")} [options]`);
  lines.push("");
  lines.push(`${c.bold("Setup:")}`);
  lines.push(`  ${c.cyan("init")}                   Initialize Beacon docs convention in this project`);
  lines.push("");
  lines.push(`${c.bold("Lifecycle:")}`);
  lines.push(`  ${c.cyan("new <type> <slug>")}      Create a new doc with correct location and naming`);
  lines.push(`  ${c.cyan("archive <type> <slug>")}  Move a completed plan or roadmap to _archive/`);
  lines.push(`  ${c.cyan("enable <addon>")}         Enable an add-on category`);
  lines.push(`  ${c.cyan("disable <addon>")}        Disable an add-on category`);
  lines.push("");
  lines.push(`${c.bold("Validation:")}`);
  lines.push(`  ${c.cyan("sync")}                   Regenerate AI rule files from docs/_meta/convention.md`);
  lines.push(`  ${c.dim("                         ↳ Run after editing convention.md, or if `lint`")}`);
  lines.push(`  ${c.dim("                           reports ai-files-sync (generated files drifted).")}`);
  lines.push(`  ${c.cyan("lint")}                   Validate the docs tree against the convention`);
  lines.push(`  ${c.cyan("doctor")}                 Surface docs-tree health signals`);
  lines.push(`  ${c.dim("                         ↳ Stale plans, proposed ADRs, old evals, backlog balance.")}`);
  lines.push("");
  lines.push(`${c.bold("Shell:")}`);
  lines.push(`  ${c.cyan("completion <shell>")}     Print a shell completion script (bash | zsh | fish)`);
  lines.push("");
  lines.push(`${c.bold("Diagnostics:")}`);
  lines.push(`  ${c.cyan("about")}                  Show version, install location, project config, AI-file status`);
  lines.push("");
  lines.push(c.dim(`Run \`beacon <command> --help\` for command-specific options.`));
  return lines.join("\n");
}

// Friendly help for `beacon enable` / `beacon disable` invoked without an addon name
function renderEnableHelp(verb: "enable" | "disable"): string {
  const lines: string[] = [];
  lines.push(`${c.bold("Usage:")}`);
  lines.push(`  beacon ${verb} ${c.cyan("<addon>")}`);
  lines.push("");
  lines.push(`${c.bold("Available add-on categories:")}`);
  const descriptions: Record<string, string> = {
    compliance: "regulatory docs (GDPR, SOC2, HIPAA, ...)",
    business: "strategy, pricing, market positioning",
    modules: "functional/business modules (monorepo workspaces)",
    integrations: "third-party integration setup guides",
    operations: "deploy guides, admin runbooks, troubleshooting",
    roadmaps: "multi-sprint planning documents",
  };
  for (const addon of ADDON_CATEGORIES) {
    lines.push(`  ${c.cyan(addon.padEnd(14))} ${c.dim(descriptions[addon] ?? "")}`);
  }
  lines.push("");
  lines.push(`${c.bold("Examples:")}`);
  lines.push(`  beacon ${verb} operations`);
  lines.push(`  beacon ${verb} compliance`);
  if (verb === "disable") {
    lines.push("");
    lines.push(c.dim("Pass --force to disable an add-on whose folder still contains documents."));
  }
  return lines.join("\n");
}

// Friendly help for `beacon new` invoked without args (instead of cac's "missing required arg" error)
function renderNewHelp(): string {
  const lines: string[] = [];
  lines.push(`${c.bold("Usage:")}`);
  lines.push(`  beacon new ${c.cyan("<type>")} ${c.cyan("<slug>")} [--category <integrations|operations>]`);
  lines.push("");
  lines.push(`${c.bold("Available types:")}`);
  const types: Array<[string, string, string]> = [
    ["plan", "active work with TODOs", "docs/plans/<slug>.plan.md"],
    ["adr", "architecture decision record", "docs/adr/ADR-NNN-<slug>.md  (auto-numbered)"],
    ["pattern", "replicable technical pattern", "docs/reference/<slug>.pattern.md"],
    ["eval", "dated audit / snapshot", "docs/evaluations/YYYY-MM-DD-<slug>.eval.md"],
    ["architecture", "system structure document", "docs/architecture/<slug>.architecture.md"],
    ["module", "functional / business module", "docs/modules/<slug>.module.md  (requires modules addon)"],
    ["guide", "operational / integration setup", "docs/{integrations,operations}/<slug>.guide.md"],
    ["roadmap", "multi-sprint roadmap", "docs/roadmaps/<slug>.roadmap.md  (requires roadmaps addon)"],
    ["todo", "backlog item", "docs/backlog/<slug>.todo.md"],
    ["business", "business / strategy doc", "docs/business/<slug>.business.md  (requires business addon)"],
    ["compliance", "regulatory document", "docs/compliance/<slug>.md  (requires compliance addon)"],
  ];
  for (const [t, desc, dest] of types) {
    lines.push(`  ${c.cyan(t.padEnd(12))} ${desc.padEnd(34)} ${c.dim("→ " + dest)}`);
  }
  lines.push("");
  lines.push(`${c.bold("Examples:")}`);
  lines.push(`  beacon new plan billing-integration`);
  lines.push(`  beacon new adr add-rate-limiting`);
  lines.push(`  beacon new guide deploy-staging ${c.dim("--category operations")}`);
  lines.push("");
  lines.push(c.dim("Slugs must be kebab-case (lowercase, hyphen-separated)."));
  return lines.join("\n");
}

// Known commands — keep in sync with the `cli.command(...)` definitions above.
// Used for unknown-command typo correction (Levenshtein "did you mean?").
const KNOWN_COMMANDS = ["init", "sync", "new", "archive", "enable", "disable", "lint", "doctor", "completion", "about"];

// Intercept --help, no-args, and `new` without args BEFORE cli.parse()
const args = process.argv.slice(2);
const hasHelp = args.includes("--help") || args.includes("-h");
const hasVersion = args.includes("--version") || args.includes("-v");
const noArgs = args.length === 0;
if (noArgs || (hasHelp && args.length === 1)) {
  console.log(renderHelp());
  process.exit(0);
}
// `beacon new` with no type/slug → show friendly types reference instead of cac error
if (args.length === 1 && args[0] === "new") {
  console.log(renderNewHelp());
  process.exit(0);
}
// `beacon enable` / `beacon disable` with no addon → show available add-ons
if (args.length === 1 && (args[0] === "enable" || args[0] === "disable")) {
  console.log(renderEnableHelp(args[0] as "enable" | "disable"));
  process.exit(0);
}
// Unknown command → suggest closest match via Levenshtein distance.
// Skip if the first arg looks like a flag, or matches a known command, or is a help/version invocation.
const firstArg = args[0];
if (
  firstArg &&
  !firstArg.startsWith("-") &&
  !hasHelp &&
  !hasVersion &&
  !KNOWN_COMMANDS.includes(firstArg)
) {
  const suggestion = closestMatch(firstArg, KNOWN_COMMANDS);
  console.error(`${CROSS} ${c.bold("Error:")} Unknown command "${firstArg}".`);
  if (suggestion) {
    console.error(c.dim(`  ${ARROW} Did you mean ${c.cyan(suggestion)}?`));
  } else {
    console.error(c.dim(`  ${ARROW} Run \`beacon --help\` to see available commands.`));
  }
  process.exit(1);
}

cli.help();
cli.version(pkg.version);
cli.parse();

function splitList(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
