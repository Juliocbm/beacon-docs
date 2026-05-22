import fs from "fs-extra";
import path from "node:path";
import type { BeaconConfig } from "../core/config";
import { writeConfig } from "../core/config";
import { isArchivable } from "../core/categories";
import { docsDir, metaDir, categoryDir, archiveDir, conventionPath } from "../core/paths";
import { renderMasterReadme, renderCategoryReadme } from "./readme";
import { renderConventionPlaceholder } from "./convention-placeholder";

export async function scaffoldStructure(
  root: string,
  config: BeaconConfig,
): Promise<void> {
  await fs.ensureDir(metaDir(root));

  for (const category of config.categories) {
    const dir = categoryDir(root, category);
    await fs.ensureDir(dir);
    if (isArchivable(category)) {
      await fs.ensureDir(archiveDir(root, category));
    }
    const readmePath = path.join(dir, "README.md");
    if (!(await fs.pathExists(readmePath))) {
      await fs.writeFile(readmePath, renderCategoryReadme(category), "utf8");
    }
  }

  const masterReadmePath = path.join(docsDir(root), "README.md");
  if (!(await fs.pathExists(masterReadmePath))) {
    await fs.writeFile(masterReadmePath, renderMasterReadme(config), "utf8");
  }

  const convention = conventionPath(root);
  if (!(await fs.pathExists(convention))) {
    await fs.writeFile(convention, renderConventionPlaceholder(config), "utf8");
  }

  await writeConfig(root, config);
}
