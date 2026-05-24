import { cac } from "cac";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runInit, runInitInteractive } from "./commands/init";
import type { AgentId } from "./core/config";
import type { ProjectType } from "./core/project-types";
import type { ExistingFileAction } from "./core/existing-files";
import { renderLogo } from "./ui/logo";
import { c } from "./ui/colors";
import { CHECK, CROSS, WARN } from "./ui/glyphs";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.join(here, "..", "package.json"), "utf8"),
) as { version: string };

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
  .command("lint", "Validate the docs tree against the convention")
  .option("--strict", "Escalate warnings to errors")
  .option("--json", "Emit JSON output")
  .action(async (opts) => {
    const { runLintCommand } = await import("./commands/lint");
    const result = await runLintCommand({
      root: process.cwd(),
      strict: !!opts.strict,
      json: !!opts.json,
    });
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
  lines.push(`  ${c.cyan("lint")}                   Validate the docs tree against the convention`);
  lines.push("");
  lines.push(c.dim(`Run \`beacon <command> --help\` for command-specific options.`));
  return lines.join("\n");
}

// Intercept --help and no-args BEFORE cli.parse()
const args = process.argv.slice(2);
const hasHelp = args.includes("--help") || args.includes("-h");
const noArgs = args.length === 0;
if (noArgs || (hasHelp && args.length === 1)) {
  console.log(renderHelp());
  process.exit(0);
}

cli.help();
cli.version(pkg.version);
cli.parse();

function splitList(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
