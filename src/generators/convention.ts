import ejs from "ejs";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BeaconConfig } from "../core/config";
import { CATEGORY_META } from "../core/categories";
import type { Category } from "../core/project-types";

function resolveTemplateDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(here, "templates");
  if (fs.existsSync(candidate)) return candidate;
  return path.join(here, "..", "templates");
}
const TEMPLATE_DIR = resolveTemplateDir();

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  reference: "Replicable technical patterns.",
  architecture: "System structure and layering decisions.",
  adr: "Architecture Decision Records.",
  plans: "Active work with TODOs.",
  backlog: "Future items waiting to be sprinted.",
  evaluations: "Date-prefixed audits and snapshots.",
  compliance: "Regulatory and normative docs.",
  business: "Business model and product strategy.",
  modules: "Domain modules and their behavior.",
  integrations: "External service setup.",
  operations: "Runbooks and deploy guides.",
  roadmaps: "Multi-sprint planning.",
};

export function renderConvention(config: BeaconConfig): string {
  const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, "convention.md.ejs"), "utf8");
  const suffixes: Record<string, string> = {};
  const suffixNotes: Record<string, string> = {};
  for (const c of config.categories) {
    suffixes[c] = CATEGORY_META[c].suffix;
    if (CATEGORY_META[c].numberedPrefix) suffixNotes[c] = `Auto-numbered (${CATEGORY_META[c].numberedPrefix}NNN-).`;
    if (CATEGORY_META[c].datePrefix) suffixNotes[c] = "Requires `YYYY-MM-DD-` prefix.";
  }
  return ejs.render(tpl, {
    projectType: config.projectType,
    categories: config.categories,
    descriptions: CATEGORY_DESCRIPTIONS,
    suffixes,
    suffixNotes,
  });
}

// Keep backward-compat export used by scaffold.ts during transition
export const renderConventionPlaceholder = renderConvention;
