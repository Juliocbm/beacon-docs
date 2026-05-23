import { cac } from "cac";
import path from "node:path";
import { runInit, runInitInteractive } from "./commands/init";
import type { AgentId } from "./core/config";
import type { ProjectType } from "./core/project-types";
import type { ExistingFileAction } from "./core/existing-files";

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
        console.error("Error: --type is required when using --yes.");
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
    console.log("✔ AI rule files regenerated.");
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
    console.log(`✔ Created ${path.relative(process.cwd(), file)}`);
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
      for (const w of result.warnings) console.warn(`⚠ ${w}`);
    }
    console.log(`✔ Archived to ${path.relative(process.cwd(), result.destination)}`);
  });

cli.help();
cli.version("0.0.0");
cli.parse();

function splitList(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
