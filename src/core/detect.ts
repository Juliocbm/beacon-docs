import fs from "fs-extra";
import path from "node:path";
import type { AddonCategory } from "./project-types";

export interface ProjectContext {
  hasPackageJson: boolean;
  hasTsconfig: boolean;
  hasGit: boolean;
  dependencies: string[];
  existingAgentFiles: string[];
  suggestedAddons: AddonCategory[];
  suggestedSubfolders: string[];
}

const AGENT_FILES = [
  "CLAUDE.md",
  "AGENTS.md",
  "GEMINI.md",
  ".cursorrules",
];

const INTEGRATIONS_HINTS = [
  "stripe",
  "@stripe/stripe-js",
  "mailgun-js",
  "twilio",
  "@sendgrid/mail",
  "resend",
];

const DATABASE_HINTS = [
  "@prisma/client",
  "prisma",
  "drizzle-orm",
  "mongoose",
  "typeorm",
  "knex",
  "sequelize",
];

export async function detectContext(root: string): Promise<ProjectContext> {
  const pkgPath = path.join(root, "package.json");
  const tsconfigPath = path.join(root, "tsconfig.json");
  const gitPath = path.join(root, ".git");

  const hasPackageJson = await fs.pathExists(pkgPath);
  const hasTsconfig = await fs.pathExists(tsconfigPath);
  const hasGit = await fs.pathExists(gitPath);

  let dependencies: string[] = [];
  if (hasPackageJson) {
    const pkg = await fs.readJson(pkgPath);
    dependencies = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
  }

  const existingAgentFiles: string[] = [];
  for (const f of AGENT_FILES) {
    if (await fs.pathExists(path.join(root, f))) {
      existingAgentFiles.push(f);
    }
  }

  const suggestedAddons: AddonCategory[] = [];
  if (dependencies.some((d) => INTEGRATIONS_HINTS.includes(d))) {
    suggestedAddons.push("integrations");
  }

  const suggestedSubfolders: string[] = [];
  if (dependencies.some((d) => DATABASE_HINTS.includes(d))) {
    suggestedSubfolders.push("reference/database");
  }

  return {
    hasPackageJson,
    hasTsconfig,
    hasGit,
    dependencies,
    existingAgentFiles,
    suggestedAddons,
    suggestedSubfolders,
  };
}
