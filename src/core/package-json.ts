import fs from "fs-extra";
import path from "node:path";

export async function addDocsLintScript(projectRoot: string): Promise<void> {
  const p = path.join(projectRoot, "package.json");
  if (!(await fs.pathExists(p))) return;

  const pkg = (await fs.readJson(p)) as { scripts?: Record<string, string> };
  pkg.scripts ??= {};
  if (pkg.scripts["docs:lint"] === undefined) {
    pkg.scripts["docs:lint"] = "beacon lint";
    await fs.writeFile(p, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  }
}
