import ejs from "ejs";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BeaconConfig } from "../core/config";
import { metaFor } from "../core/categories";
import type { Category } from "../core/project-types";

const TEMPLATE_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
);

const CATEGORY_DESCRIPTIONS: Record<Category, { title: string; description: string }> = {
  reference: { title: "reference/", description: "Replicable technical patterns — *how* something is done." },
  architecture: { title: "architecture/", description: "System structure and layering decisions." },
  adr: { title: "adr/", description: "Architecture Decision Records — *why* a choice was made." },
  plans: { title: "plans/", description: "Active work with checked TODOs." },
  backlog: { title: "backlog/", description: "Future work items not yet planned." },
  evaluations: { title: "evaluations/", description: "Date-prefixed audits and state snapshots." },
  compliance: { title: "compliance/", description: "Regulatory and normative documents." },
  business: { title: "business/", description: "Business model, pricing, product strategy." },
  modules: { title: "modules/", description: "Domain modules and their functional behavior." },
  integrations: { title: "integrations/", description: "External service setup and configuration." },
  operations: { title: "operations/", description: "Runbooks, deploy guides, troubleshooting." },
  roadmaps: { title: "roadmaps/", description: "Multi-sprint planning (longer than `plans/`)." },
};

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
    description: d.description,
    suffix: m.suffix,
    numberedPrefix: m.numberedPrefix,
    datePrefix: m.datePrefix,
    archivable: m.archivable,
  });
}
