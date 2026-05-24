import type { Check, Finding } from "../types";

const MIN_PLANS_TO_CONSIDER = 5;
const MAX_PLANS_PER_BACKLOG_ITEM = 5;

function countActive(files: { category: string; isReadme: boolean; isArchived: boolean }[], category: string): number {
  return files.filter((f) => f.category === category && !f.isReadme && !f.isArchived).length;
}

export const check: Check = {
  name: "backlog-balance",
  area: "balance",
  check(ctx) {
    const plans = countActive(ctx.files, "plans");
    const backlog = countActive(ctx.files, "backlog");

    if (plans <= MIN_PLANS_TO_CONSIDER) return [];

    const unbalanced =
      backlog === 0 || plans / backlog > MAX_PLANS_PER_BACKLOG_ITEM;

    if (!unbalanced) return [];

    const finding: Finding = {
      area: "balance",
      check: "backlog-balance",
      observation: `${plans} active plans, ${backlog} backlog items.`,
      suggestion:
        "Convert finished plans to archived (`beacon archive plan <slug>`) and capture future work as backlog items (`beacon new todo <slug>`) to keep planning sustainable.",
    };
    return [finding];
  },
};
