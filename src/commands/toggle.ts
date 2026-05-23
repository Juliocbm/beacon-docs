import fs from "fs-extra";
import path from "node:path";
import { readConfig, writeConfig } from "../core/config";
import { categoryDir, archiveDir } from "../core/paths";
import { isArchivable } from "../core/categories";
import { renderCategoryReadme } from "../generators/readme";
import { runSync } from "./sync";
import type { Category } from "../core/project-types";

export async function runEnable(opts: { root: string; addon: string }): Promise<void> {
  const cfg = await readConfig(opts.root);
  const addon = opts.addon as Category;
  if (!cfg.categories.includes(addon)) {
    cfg.categories.push(addon);
    await writeConfig(opts.root, cfg);
  }
  const dir = categoryDir(opts.root, addon);
  await fs.ensureDir(dir);
  const readme = path.join(dir, "README.md");
  if (!(await fs.pathExists(readme))) {
    await fs.writeFile(readme, renderCategoryReadme(addon), "utf8");
  }
  if (isArchivable(addon)) {
    await fs.ensureDir(archiveDir(opts.root, addon));
  }
  await runSync({ root: opts.root });
}

export async function runDisable(opts: {
  root: string;
  addon: string;
  force: boolean;
}): Promise<void> {
  const cfg = await readConfig(opts.root);
  const dir = categoryDir(opts.root, opts.addon);
  if (await fs.pathExists(dir)) {
    const entries = await fs.readdir(dir);
    const hasContent = entries.some(
      (e) => e !== "README.md" && e !== "_archive",
    );
    if (hasContent && !opts.force) {
      throw new Error(
        `Folder ${dir} contains documents. Re-run with --force to disable anyway (files are kept on disk).`,
      );
    }
  }
  cfg.categories = cfg.categories.filter((c) => c !== opts.addon);
  await writeConfig(opts.root, cfg);
  await runSync({ root: opts.root });
}
