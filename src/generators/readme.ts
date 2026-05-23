import ejs from "ejs";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BeaconConfig } from "../core/config";
import { metaFor } from "../core/categories";
import type { Category } from "../core/project-types";
import { CATEGORY_DESCRIPTIONS } from "../core/category-descriptions";

function resolveTemplateDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(here, "templates");
  if (fs.existsSync(candidate)) return candidate;
  return path.join(here, "..", "templates");
}
const TEMPLATE_DIR = resolveTemplateDir();

export function renderMasterReadme(config: BeaconConfig): string {
  const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, "readme-master.md.ejs"), "utf8");
  const has = (c: string) => config.categories.includes(c as Category);
  return ejs.render(tpl, { projectType: config.projectType, has }, { rmWhitespace: false });
}

export function renderCategoryReadme(category: Category): string {
  const tpl = fs.readFileSync(path.join(TEMPLATE_DIR, "readme-category.md.ejs"), "utf8");
  const m = metaFor(category);
  const d = CATEGORY_DESCRIPTIONS[category];
  return ejs.render(tpl, {
    title: d.title,
    description: d.long,
    suffix: m.suffix,
    numberedPrefix: m.numberedPrefix,
    datePrefix: m.datePrefix,
    archivable: m.archivable,
  });
}
