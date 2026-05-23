import fs from "fs-extra";
import path from "node:path";
import { readConfig } from "../core/config";
import { metaFor } from "../core/categories";
import { categoryDir } from "../core/paths";
import { nextAdrNumber } from "../core/adr-numbering";
import { renderDoc, type DocType } from "../generators/doc";
import type { Category } from "../core/project-types";

const DOC_TYPE_TO_CATEGORY: Record<DocType, Category> = {
  plan: "plans",
  adr: "adr",
  pattern: "reference",
  eval: "evaluations",
  architecture: "architecture",
  module: "modules",
  guide: "integrations", // ambiguous — caller can override via `category` field
  roadmap: "roadmaps",
  todo: "backlog",
  business: "business",
  compliance: "compliance",
};

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface RunNewInput {
  root: string;
  type: DocType;
  slug: string;
  today: string;
  category?: "integrations" | "operations";
}

export async function runNew(input: RunNewInput): Promise<string> {
  if (!KEBAB.test(input.slug)) {
    throw new Error(`Slug must be kebab-case: "${input.slug}".`);
  }

  const config = await readConfig(input.root);

  const category: Category =
    input.type === "guide" && input.category
      ? input.category
      : DOC_TYPE_TO_CATEGORY[input.type];

  if (!config.categories.includes(category)) {
    throw new Error(
      `Category "${category}" is not enabled. Run \`beacon enable ${category}\` first.`,
    );
  }

  const meta = metaFor(category);
  const dir = categoryDir(input.root, category);
  let filename: string;
  let number: string | undefined;

  if (meta.numberedPrefix) {
    number = await nextAdrNumber(input.root);
    filename = `${meta.numberedPrefix}${number}-${input.slug}.md`;
  } else if (meta.datePrefix) {
    filename = `${input.today}-${input.slug}${meta.suffix}`;
  } else {
    filename = `${input.slug}${meta.suffix}`;
  }

  const filePath = path.join(dir, filename);
  if (await fs.pathExists(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }

  const content = renderDoc({
    type: input.type,
    title: input.slug,
    today: input.today,
    number,
  });

  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}
