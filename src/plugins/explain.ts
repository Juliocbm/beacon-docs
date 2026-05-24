import { c } from "../ui/colors";
import { ARROW } from "../ui/glyphs";
import type { LoadedPlugin } from "./types";

/**
 * Build an `--explain` block for a plugin-contributed rule or check.
 *
 * Returns null when neither the plugin nor any other source documents it.
 * `kind` is just a label ("rule" / "check") used in the heading.
 */
export function renderPluginExplain(
  name: string,
  kind: "rule" | "check",
  plugins: LoadedPlugin[],
): string | null {
  for (const lp of plugins) {
    const items = kind === "rule" ? lp.plugin.rules ?? [] : lp.plugin.checks ?? [];
    const hit = items.find((it) => it.name === name);
    if (!hit) continue;

    const lines: string[] = [];
    lines.push("");
    lines.push(`${ARROW} ${c.bold(`${kind === "rule" ? "Rule" : "Check"}: ${name}`)} ${c.dim(`(plugin: ${lp.plugin.name})`)}`);
    lines.push("");

    const doc = lp.plugin.explain?.[name];
    if (doc) {
      lines.push(c.dim(doc.summary));
      lines.push("");
      if (doc.why) {
        lines.push(c.bold("Why this exists:"));
        lines.push("  " + doc.why.replace(/\n/g, "\n  "));
        lines.push("");
      }
      if (doc.fix) {
        lines.push(c.bold("How to fix:"));
        lines.push("  " + doc.fix.replace(/\n/g, "\n  "));
        lines.push("");
      }
    } else {
      lines.push(
        c.dim(
          `No explainer text provided by the plugin. Ask the plugin author to add an \`explain\` entry, or check the plugin's README.`,
        ),
      );
      lines.push("");
    }
    return lines.join("\n");
  }
  return null;
}

/**
 * Collect every plugin-contributed name (rule or check) so the typo-suggest
 * helper can offer cross-cutting matches.
 */
export function getPluginNames(plugins: LoadedPlugin[], kind: "rule" | "check"): string[] {
  return plugins.flatMap((lp) =>
    (kind === "rule" ? lp.plugin.rules ?? [] : lp.plugin.checks ?? []).map((it) => it.name),
  );
}
