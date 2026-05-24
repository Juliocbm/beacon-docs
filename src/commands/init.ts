import {
  PROJECT_TYPES,
  CORE_CATEGORIES,
  ADDON_CATEGORIES,
  defaultCategoriesFor,
  isValidProjectType,
  type ProjectType,
  type Category,
} from "../core/project-types";
import type { AgentId, BeaconConfig } from "../core/config";
import { scaffoldStructure } from "../generators/scaffold";
import { addDocsLintScript } from "../core/package-json";
import type { ExistingFileAction } from "../core/existing-files";
import * as p from "@clack/prompts";
import { detectContext } from "../core/detect";
import { CATEGORY_DESCRIPTIONS } from "../core/category-descriptions";

export interface InitOptions {
  root: string;
  yes: boolean;
  type: ProjectType;
  with: string[];
  without: string[];
  agents: AgentId[];
  language: string;
  existingFiles: ExistingFileAction;
}

const ALL_CATEGORIES = new Set<string>([...CORE_CATEGORIES, ...ADDON_CATEGORIES]);

export async function runInit(options: InitOptions): Promise<BeaconConfig> {
  if (!isValidProjectType(options.type)) {
    throw new Error(
      `Unknown project type: "${options.type}". Valid types: ${PROJECT_TYPES.join(", ")}.`,
    );
  }

  for (const c of [...options.with, ...options.without]) {
    if (!ALL_CATEGORIES.has(c)) {
      throw new Error(
        `Unknown category: "${c}". Valid categories: ${[...ALL_CATEGORIES].join(", ")}.`,
      );
    }
  }

  const defaults = defaultCategoriesFor(options.type);
  const finalSet = new Set<Category>(defaults);
  for (const c of options.with) finalSet.add(c as Category);
  for (const c of options.without) finalSet.delete(c as Category);

  const config: BeaconConfig = {
    version: "1.0",
    projectType: options.type,
    categories: [...finalSet],
    agents: options.agents,
    language: options.language,
  };

  await scaffoldStructure(options.root, config);
  await addDocsLintScript(options.root);

  const { runSync } = await import("./sync");
  await runSync({ root: options.root, silent: true });

  return config;
}

export async function runInitInteractive(opts: { root: string }): Promise<BeaconConfig> {
  p.intro("Beacon — initialize docs convention");

  p.note(
    `1. Ask about your project type and which doc categories to enable
2. Create a \`docs/\` folder structure in this directory
3. Generate AI rule files (CLAUDE.md, AGENTS.md, etc.) at the project root
4. Add a \`docs:lint\` script to your package.json (if present)

Press Ctrl+C to abort. Nothing is written until you confirm all choices.`,
    "This wizard will:",
  );

  const ctx = await detectContext(opts.root);

  const projectTypeHint = (t: ProjectType): string => {
    const cats = defaultCategoriesFor(t);
    if (cats.length === 0) return "nothing pre-selected — you opt into everything";
    const addons = cats.filter((c) => !(CORE_CATEGORIES as readonly string[]).includes(c));
    if (addons.length === 0) return "core only (minimal)";
    return `core + ${addons.join(", ")}`;
  };

  const type = (await p.select({
    message: "Project type?",
    options: [
      { value: "web-app", label: "Web Application (full-stack, SaaS)", hint: projectTypeHint("web-app") },
      { value: "backend-service", label: "Backend Service / API", hint: projectTypeHint("backend-service") },
      { value: "library", label: "Library / SDK / Package", hint: projectTypeHint("library") },
      { value: "cli-tool", label: "CLI Tool", hint: projectTypeHint("cli-tool") },
      { value: "mobile-app", label: "Mobile App", hint: projectTypeHint("mobile-app") },
      { value: "monorepo", label: "Monorepo / Workspace", hint: projectTypeHint("monorepo") },
      { value: "custom", label: "Custom (no defaults)", hint: projectTypeHint("custom") },
    ],
  })) as ProjectType;
  if (p.isCancel(type)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  const defaults = defaultCategoriesFor(type);
  const categoryOptions = [...CORE_CATEGORIES, ...ADDON_CATEGORIES].map((c) => {
    const desc = CATEGORY_DESCRIPTIONS[c].short;
    const suggested = ctx.suggestedAddons.includes(c as never);
    return {
      value: c,
      label: c,
      hint: suggested ? `${desc} · suggested by detection` : desc,
    };
  });

  const categories = (await p.multiselect({
    message: "Which categories to enable?",
    options: categoryOptions,
    initialValues: defaults,
    required: false,
  })) as Category[];
  if (p.isCancel(categories)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  const agents = (await p.multiselect({
    message: "Which AI agents do you use?",
    options: [
      { value: "claude", label: "Claude Code", hint: "generates CLAUDE.md at project root" },
      { value: "cursor", label: "Cursor", hint: "generates .cursorrules + .cursor/rules/beacon.mdc" },
      { value: "codex", label: "Codex / Copilot", hint: "generates AGENTS.md at project root" },
      { value: "gemini", label: "Gemini CLI", hint: "generates GEMINI.md at project root" },
    ],
    initialValues: ["claude", "cursor"],
    required: true,
  })) as AgentId[];
  if (p.isCancel(agents)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  let existingAction: ExistingFileAction = "replace";
  if (ctx.existingAgentFiles.length > 0) {
    const action = await p.select({
      message: `Existing files found (${ctx.existingAgentFiles.join(", ")}). What do you want to do?`,
      options: [
        { value: "merge", label: "Merge — keep existing content, append Beacon section" },
        { value: "replace", label: "Replace — overwrite with Beacon content" },
        { value: "skip", label: "Skip — leave them untouched" },
      ],
    });
    if (p.isCancel(action)) {
      p.cancel("Cancelled.");
      process.exit(0);
    }
    existingAction = action as ExistingFileAction;
  }

  const config = await runInit({
    root: opts.root,
    yes: true,
    type,
    with: categories.filter((c) => !defaults.includes(c)),
    without: defaults.filter((c) => !categories.includes(c)),
    agents,
    language: "en",
    existingFiles: existingAction,
  });

  p.outro(`Beacon docs scaffolded at ${opts.root}/docs/`);
  return config;
}
