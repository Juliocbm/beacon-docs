---
title: Adding a new lint rule to Beacon
created: 2026-05-22
---

# Adding a new lint rule to Beacon

## Problem

You want to add a new validation check to `beacon lint` — e.g., detecting orphaned documents,
enforcing a naming convention for a new category, or flagging documents missing required frontmatter
fields.

## Solution

### 1. Create the rule file in `src/linter/rules/`

Each rule is a file that exports a single `rule` object implementing the `Rule` interface from
`src/linter/types.ts`:

```typescript
// src/linter/rules/my-new-rule.ts
import type { Rule } from "../types";

export const rule: Rule = {
  name: "my-new-rule",          // unique identifier, used in Finding output
  severity: "warning",          // "error" | "warning" | "suggestion"
  check(ctx) {                  // ctx: RuleContext — see types.ts
    const findings = [];

    for (const f of ctx.files) {
      // ctx.files: DocFile[] — all docs in the docs/ tree
      // f.basename, f.relativePath, f.category, f.isReadme, f.isArchived
      if (someCondition(f)) {
        findings.push({
          severity: "warning" as const,
          rule: "my-new-rule",
          file: f.relativePath,   // optional — omit for project-wide findings
          message: "Describe what is wrong and how to fix it.",
        });
      }
    }

    return findings;  // can also return Promise<Finding[]> for async rules
  },
};
```

**`RuleContext` fields:**

| Field | Type | Description |
|---|---|---|
| `root` | `string` | Absolute path to the project root |
| `config` | `BeaconConfig` | Contents of `beacon.config.json` |
| `files` | `DocFile[]` | All non-README docs found in `docs/` |

**Severity guidance:**
- `error`: convention violation that must be fixed; causes exit code 1.
- `warning`: noteworthy deviation (never error with `--strict`); exit code 0 normally.
- `suggestion`: informational nudge; exit code always 0.

### 2. Register the rule in `src/commands/lint.ts`

Import and add to the `RULES` array:

```typescript
import { rule as myNewRule } from "../linter/rules/my-new-rule";

const RULES = [
  suffixLocation,
  kebabCase,
  // ... existing rules ...
  myNewRule,   // add here
];
```

Order matters only for output readability — errors first, then warnings, then suggestions.

### 3. Write tests in `tests/unit/linter/rules/`

Tests use a helper function that constructs a minimal `RuleContext`:

```typescript
import { describe, it, expect } from "vitest";
import { rule as myNewRule } from "../../../../src/linter/rules/my-new-rule";
import type { RuleContext } from "../../../../src/linter/types";

function ctx(overrides: Partial<RuleContext> = {}): RuleContext {
  return {
    root: "/r",
    config: {
      version: "1.0", projectType: "library",
      categories: ["reference", "plans"],
      agents: ["claude"], language: "en",
    },
    files: [],
    ...overrides,
  };
}

describe("my-new-rule", () => {
  it("flags the bad case", async () => {
    const findings = await myNewRule.check(ctx({
      files: [{
        absolutePath: "/r/docs/plans/bad-file.plan.md",
        relativePath: "plans/bad-file.plan.md",
        category: "plans",
        basename: "bad-file.plan.md",
        isReadme: false,
        isArchived: false,
      }],
    }));
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("warning");
  });

  it("passes the good case", async () => {
    const findings = await myNewRule.check(ctx({ files: [] }));
    expect(findings).toEqual([]);
  });
});
```

Add your test file to `tests/unit/linter/rules/` alongside the existing `error-rules.test.ts`
and `warning-rules.test.ts` files (or extend those if the rule fits cleanly with existing tests).

## Example

See `src/linter/rules/stale-plans.ts` for an example of a suggestion-severity rule that uses
file metadata (last modified time) to produce time-based findings.
