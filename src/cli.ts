import { cac } from "cac";
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

cli.help();
cli.version("0.0.0");
cli.parse();

function splitList(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
