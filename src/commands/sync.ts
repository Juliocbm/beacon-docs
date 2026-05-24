import fs from "fs-extra";
import path from "node:path";
import { readConfig } from "../core/config";
import { rootFile } from "../core/paths";
import { renderClaudeMd } from "../generators/claude";
import { renderAgentsMd } from "../generators/agents";
import { renderGeminiMd } from "../generators/gemini";
import { renderCursorRules, renderCursorMdc } from "../generators/cursor";
import { withSpinner } from "../ui/spinner";

export async function runSync(opts: { root: string; silent?: boolean }): Promise<void> {
  const config = await readConfig(opts.root);

  const work = async () => {
    if (config.agents.includes("claude")) {
      await fs.writeFile(rootFile(opts.root, "CLAUDE.md"), renderClaudeMd(config), "utf8");
    }
    if (config.agents.includes("codex")) {
      await fs.writeFile(rootFile(opts.root, "AGENTS.md"), renderAgentsMd(config), "utf8");
    }
    if (config.agents.includes("gemini")) {
      await fs.writeFile(rootFile(opts.root, "GEMINI.md"), renderGeminiMd(config), "utf8");
    }
    if (config.agents.includes("cursor")) {
      await fs.writeFile(rootFile(opts.root, ".cursorrules"), renderCursorRules(config), "utf8");
      const mdcDir = path.join(opts.root, ".cursor", "rules");
      await fs.ensureDir(mdcDir);
      await fs.writeFile(path.join(mdcDir, "beacon.mdc"), renderCursorMdc(config), "utf8");
    }
  };

  if (opts.silent) {
    await work();
  } else {
    await withSpinner("Regenerating AI rule files...", work);
  }
}
