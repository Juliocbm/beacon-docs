import fs from "fs-extra";
import path from "node:path";
import { metaFor } from "../core/categories";
import { archiveDir, categoryDir } from "../core/paths";
import type { Category } from "../core/project-types";

export interface RunArchiveInput {
  root: string;
  type: string;
  slug: string;
  force: boolean;
}

export interface ArchiveResult {
  source: string;
  destination: string;
  warnings: string[];
}

const TYPE_TO_CATEGORY: Record<string, Category> = {
  plan: "plans",
  roadmap: "roadmaps",
};

export async function runArchive(input: RunArchiveInput): Promise<ArchiveResult> {
  const category = TYPE_TO_CATEGORY[input.type];
  if (!category) {
    throw new Error(`Type "${input.type}" cannot be archived. Only plan and roadmap support archiving.`);
  }

  const meta = metaFor(category);
  if (!meta.archivable) {
    throw new Error(`Category "${category}" cannot be archived.`);
  }

  const filename = `${input.slug}${meta.suffix}`;
  const source = path.join(categoryDir(input.root, category), filename);
  if (!(await fs.pathExists(source))) {
    throw new Error(`File not found: ${source}`);
  }

  const warnings: string[] = [];
  const body = await fs.readFile(source, "utf8");
  if (/- \[ \]/.test(body)) {
    warnings.push("Unchecked TODOs remain in the document.");
    if (!input.force) {
      throw new Error(
        "Document has unchecked TODOs. Re-run with --force to archive anyway.",
      );
    }
  }

  const dest = path.join(archiveDir(input.root, category), filename);
  await fs.ensureDir(path.dirname(dest));
  await fs.move(source, dest, { overwrite: false });

  return { source, destination: dest, warnings };
}
