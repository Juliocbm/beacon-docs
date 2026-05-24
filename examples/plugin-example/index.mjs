/**
 * Beacon example plugin.
 *
 * Demonstrates the v0.4 plugin contract — one custom doctor check and one
 * custom lint rule, plus `explain` entries so `beacon doctor --explain` and
 * `beacon lint --explain` document them.
 *
 * Wire this plugin into a project by adding to docs/_meta/beacon.config.json:
 *
 *   { "plugins": ["./path/to/this/index.mjs"] }
 *
 * Or publish to npm as `beacon-plugin-example` and list it by package name.
 */

import fs from "node:fs/promises";

/** doctor check: flags evaluation files whose body is shorter than 200 chars. */
const tinyEvalsCheck = {
  name: "tiny-evals",
  area: "snapshots",
  async check(ctx) {
    const findings = [];
    const evals = ctx.files.filter(
      (f) =>
        f.category === "evaluations" &&
        !f.isReadme &&
        !f.isArchived &&
        f.basename.endsWith(".eval.md"),
    );
    for (const file of evals) {
      const body = await fs.readFile(file.absolutePath, "utf8");
      if (body.length < 200) {
        findings.push({
          area: "snapshots",
          check: "tiny-evals",
          target: `docs/${file.relativePath}`,
          observation: `Evaluation body is only ${body.length} chars.`,
          suggestion:
            "Either flesh out the eval with concrete observations and a verdict, or delete it.",
        });
      }
    }
    return findings;
  },
};

/** lint rule: flags any markdown file containing literal "TODO:" (use the backlog instead). */
const noInlineTodoRule = {
  name: "no-inline-todo",
  severity: "warning",
  async check(ctx) {
    const findings = [];
    for (const file of ctx.files) {
      if (file.isReadme) continue;
      const body = await fs.readFile(file.absolutePath, "utf8");
      if (/^\s*TODO:/m.test(body)) {
        findings.push({
          severity: "warning",
          rule: "no-inline-todo",
          file: `docs/${file.relativePath}`,
          message: "Inline `TODO:` found — capture this as a backlog item instead.",
        });
      }
    }
    return findings;
  },
};

export default {
  name: "beacon-plugin-example",
  version: "0.1.0",
  checks: [tinyEvalsCheck],
  rules: [noInlineTodoRule],
  explain: {
    "tiny-evals": {
      summary: "Flags evaluation files with bodies shorter than 200 characters.",
      why:
        "Evaluations are meant to be substantive snapshots — observations + verdict. " +
        "A tiny eval is usually a placeholder that was never filled in.",
      fix: "Add the actual observations and findings, or delete the eval entirely.",
    },
    "no-inline-todo": {
      summary: "Flags any non-README doc containing a literal `TODO:` line.",
      why:
        "Inline TODOs scattered across docs are easy to lose. Beacon has a dedicated " +
        "`docs/backlog/` category — capture forward work there instead.",
      fix: "Move the TODO into `docs/backlog/<slug>.todo.md` via `beacon new todo <slug>`.",
    },
  },
};
