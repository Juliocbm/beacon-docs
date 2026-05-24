import type { Check, Finding } from "../types";

const OLD_EVAL_MONTHS = 6;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.eval\.md$/;

interface ParsedEval {
  timestamp: number;
  slug: string;
  basename: string;
  relativePath: string;
}

function parseEval(file: { basename: string; relativePath: string }): ParsedEval | null {
  const m = DATE_PREFIX.exec(file.basename);
  if (!m) return null;
  const [, y, mo, d, slug] = m;
  const timestamp = Date.UTC(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(timestamp)) return null;
  return { timestamp, slug: slug!.toLowerCase(), basename: file.basename, relativePath: file.relativePath };
}

export const check: Check = {
  name: "old-evaluations",
  area: "snapshots",
  check(ctx) {
    const findings: Finding[] = [];
    const evals = ctx.files
      .filter(
        (f) =>
          f.category === "evaluations" &&
          !f.isReadme &&
          !f.isArchived &&
          f.basename.endsWith(".eval.md"),
      )
      .map((f) => ({ file: f, parsed: parseEval(f) }))
      .filter((e): e is { file: typeof e.file; parsed: ParsedEval } => e.parsed !== null);

    const thresholdMs = OLD_EVAL_MONTHS * 30 * MS_PER_DAY;

    for (const { parsed } of evals) {
      const ageMs = ctx.now - parsed.timestamp;
      if (ageMs < thresholdMs) continue;

      // Has any other newer eval covered the same topic (slug substring match)?
      const refreshed = evals.some(
        (other) =>
          other.parsed.timestamp > parsed.timestamp &&
          (other.parsed.slug.includes(parsed.slug) || parsed.slug.includes(other.parsed.slug)),
      );
      if (refreshed) continue;

      const ageDays = Math.floor(ageMs / MS_PER_DAY);
      findings.push({
        area: "snapshots",
        check: "old-evaluations",
        target: `docs/${parsed.relativePath}`,
        observation: `Last evaluation on this topic is ${ageDays} days old.`,
        suggestion:
          "Create a refreshed snapshot with `beacon new eval <slug>` if the underlying state has changed.",
      });
    }
    return findings;
  },
};
