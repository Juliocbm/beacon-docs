import type { Finding } from "./types";
import { c } from "../ui/colors";
import { CROSS, WARN, ARROW, TREE_LAST } from "../ui/glyphs";

export function formatText(findings: Finding[]): string {
  const lines: string[] = [];
  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const suggestions = findings.filter((f) => f.severity === "suggestion");

  // ERRORS section
  if (errors.length > 0) {
    lines.push(`${CROSS} ${c.bold(`Errors (${errors.length})`)}`);
    for (const f of errors) {
      const loc = f.file ?? "(global)";
      lines.push(`  ${CROSS} ${c.dim(loc)}`);
      lines.push(`    ${TREE_LAST} ${c.cyan(f.rule)}: ${f.message}`);
    }
    lines.push("");
  } else {
    lines.push(`  ${c.dim(`Errors (0)`)}`);
  }

  // WARNINGS section
  if (warnings.length > 0) {
    lines.push(`${WARN} ${c.bold(`Warnings (${warnings.length})`)}`);
    for (const f of warnings) {
      const loc = f.file ?? "(global)";
      lines.push(`  ${WARN} ${c.dim(loc)}`);
      lines.push(`    ${TREE_LAST} ${c.cyan(f.rule)}: ${f.message}`);
    }
    lines.push("");
  } else {
    lines.push(`  ${c.dim(`Warnings (0)`)}`);
  }

  // SUGGESTIONS section (softer style — no severity glyph at header)
  if (suggestions.length > 0) {
    lines.push(`  ${c.dim(`Suggestions (${suggestions.length})`)}`);
    for (const f of suggestions) {
      const loc = f.file ?? "(global)";
      lines.push(`  ${ARROW} ${c.dim(loc)}`);
      lines.push(`    ${TREE_LAST} ${c.cyan(f.rule)}: ${f.message}`);
    }
    lines.push("");
  } else {
    lines.push(`  ${c.dim(`Suggestions (0)`)}`);
  }

  // All-clear footer
  if (errors.length === 0 && warnings.length === 0 && suggestions.length === 0) {
    lines.push(`  ${c.green("All clear.")}`);
  }

  return lines.join("\n");
}

export function formatJson(findings: Finding[]): string {
  return JSON.stringify(findings, null, 2);
}
