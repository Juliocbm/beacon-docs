/**
 * Single source of truth for shell completion across bash/zsh/fish.
 *
 * Each shell generator reads this schema and emits idiomatic completion logic.
 * Keep this file in sync with the `cli.ts` command surface.
 */

import { ADDON_CATEGORIES, PROJECT_TYPES } from "../core/project-types";
import { getAllRuleNames } from "../linter/rule-docs";
import { getAllCheckNames } from "../doctor/check-docs";

/** Doc types accepted by `beacon new <type>`. */
export const NEW_DOC_TYPES = [
  "plan",
  "adr",
  "pattern",
  "eval",
  "architecture",
  "module",
  "guide",
  "roadmap",
  "todo",
  "business",
  "compliance",
] as const;

/** Doc types accepted by `beacon archive <type>` (only archivable categories). */
export const ARCHIVE_DOC_TYPES = ["plan", "roadmap"] as const;

/** AI agents accepted by `beacon init --agents`. */
export const AGENT_IDS = ["claude", "cursor", "codex", "gemini"] as const;

/** Supported shells for `beacon completion <shell>`. */
export const SHELLS = ["bash", "zsh", "fish"] as const;
export type Shell = (typeof SHELLS)[number];

/** Categories valid for `beacon new guide --category`. */
export const GUIDE_CATEGORIES = ["integrations", "operations"] as const;

export interface CommandSchema {
  name: string;
  description: string;
  /** Positional values offered as the FIRST positional arg (e.g., addon name, doc type). */
  positionalValues?: readonly string[];
  /**
   * Dynamic positional source for the SECOND positional arg. If set, the shell will
   * source completion words from a filesystem glob (relative to cwd) and strip the suffix.
   * Used by `archive plan <slug>` and `archive roadmap <slug>`.
   *
   * Map keys are the first positional value (e.g. "plan"); each entry describes how to
   * find slugs for that key.
   */
  dynamicSecondPositional?: Record<string, { glob: string; suffix: string }>;
  /** Long-form flags (boolean or value-bearing). */
  flags: readonly string[];
  /**
   * For flags that take a value, the set of valid values.
   * Keyed by flag name (without leading dashes).
   */
  flagValues?: Record<string, readonly string[]>;
}

export const COMMAND_SCHEMA: readonly CommandSchema[] = [
  {
    name: "init",
    description: "Initialize Beacon docs convention in this project",
    flags: ["--yes", "--type", "--with", "--without", "--agents", "--language"],
    flagValues: {
      type: PROJECT_TYPES,
      agents: AGENT_IDS,
      with: ADDON_CATEGORIES,
      without: ADDON_CATEGORIES,
    },
  },
  {
    name: "sync",
    description: "Regenerate AI rule files from docs/_meta/convention.md",
    flags: [],
  },
  {
    name: "new",
    description: "Create a new doc with correct location and naming",
    positionalValues: NEW_DOC_TYPES,
    flags: ["--category"],
    flagValues: {
      category: GUIDE_CATEGORIES,
    },
  },
  {
    name: "archive",
    description: "Move a completed plan or roadmap to _archive/",
    positionalValues: ARCHIVE_DOC_TYPES,
    dynamicSecondPositional: {
      plan: { glob: "docs/plans/*.plan.md", suffix: ".plan.md" },
      roadmap: { glob: "docs/roadmaps/*.roadmap.md", suffix: ".roadmap.md" },
    },
    flags: ["--force"],
  },
  {
    name: "enable",
    description: "Enable an add-on category",
    positionalValues: ADDON_CATEGORIES,
    flags: [],
  },
  {
    name: "disable",
    description: "Disable an add-on category",
    positionalValues: ADDON_CATEGORIES,
    flags: ["--force"],
  },
  {
    name: "lint",
    description: "Validate the docs tree against the convention",
    flags: ["--strict", "--json", "--explain"],
    flagValues: {
      explain: getAllRuleNames(),
    },
  },
  {
    name: "doctor",
    description: "Surface docs-tree health signals",
    flags: ["--strict", "--json", "--explain"],
    flagValues: {
      explain: getAllCheckNames(),
    },
  },
  {
    name: "completion",
    description: "Print a shell completion script (bash, zsh, or fish)",
    positionalValues: SHELLS,
    flags: [],
  },
  {
    name: "about",
    description: "Show version, install location, project config, AI-file status",
    flags: [],
  },
];

export const TOP_LEVEL_COMMANDS: readonly string[] = COMMAND_SCHEMA.map((c) => c.name);

export function findCommand(name: string): CommandSchema | undefined {
  return COMMAND_SCHEMA.find((c) => c.name === name);
}
