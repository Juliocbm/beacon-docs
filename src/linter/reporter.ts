import type { Finding } from "./types";

export function formatText(findings: Finding[]): string {
  const lines: string[] = [];
  const groups = { error: [] as Finding[], warning: [] as Finding[], suggestion: [] as Finding[] };
  for (const f of findings) groups[f.severity].push(f);

  function block(title: string, items: Finding[]) {
    lines.push(`${title} (${items.length})`);
    for (const f of items) {
      const loc = f.file ? ` ${f.file}` : "";
      lines.push(`  [${f.rule}]${loc} — ${f.message}`);
    }
    lines.push("");
  }
  block("Errors", groups.error);
  block("Warnings", groups.warning);
  block("Suggestions", groups.suggestion);
  return lines.join("\n");
}

export function formatJson(findings: Finding[]): string {
  return JSON.stringify(findings, null, 2);
}
