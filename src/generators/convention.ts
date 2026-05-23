import ejs from "ejs";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BeaconConfig } from "../core/config";
import { CATEGORY_META } from "../core/categories";
import { CATEGORY_DESCRIPTIONS } from "../core/category-descriptions";

function resolveTemplateDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(here, "templates");
  if (fs.existsSync(candidate)) return candidate;
  return path.join(here, "..", "templates");
}
const TEMPLATE_DIR = resolveTemplateDir();

export function renderConvention(config: BeaconConfig): string {
  const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, "convention.md.ejs"), "utf8");
  const suffixes: Record<string, string> = {};
  const suffixNotes: Record<string, string> = {};
  const descriptions: Record<string, string> = {};
  for (const c of config.categories) {
    suffixes[c] = CATEGORY_META[c].suffix;
    descriptions[c] = CATEGORY_DESCRIPTIONS[c].short;
    if (CATEGORY_META[c].numberedPrefix) suffixNotes[c] = `Auto-numbered (${CATEGORY_META[c].numberedPrefix}NNN-).`;
    if (CATEGORY_META[c].datePrefix) suffixNotes[c] = "Requires `YYYY-MM-DD-` prefix.";
  }
  return ejs.render(tpl, {
    projectType: config.projectType,
    categories: config.categories,
    descriptions,
    suffixes,
    suffixNotes,
  });
}

// Keep backward-compat export used by scaffold.ts during transition
export const renderConventionPlaceholder = renderConvention;
