---
title: Adding support for a new AI vendor
created: 2026-05-22
---

# Adding support for a new AI vendor

## Problem

A new AI coding assistant has emerged (or an existing one changed its rule file format), and you
want Beacon to generate its rule file from `docs/_meta/convention.md`. This requires wiring up
a generator, registering the vendor in the sync command, adding it to the lint check, and adding
it to the config type.

## Solution

Four files must be touched in coordination:

### 1. Create the generator in `src/generators/<vendor>.ts`

Each vendor's generator is a module that exports a render function. Use an existing generator as
the template — they all follow the same pattern:

```typescript
// src/generators/myvendor.ts
import type { BeaconConfig } from "../core/config";
import { HEADER } from "./_header";
import { buildUniversalRules, buildProjectSpecificRules, buildDecisionTable } from "./ai-rules";

export function renderMyVendorFile(config: BeaconConfig): string {
  return [
    HEADER,
    "",
    "# Documentation Convention",
    "",
    "> Project type: **" + config.projectType + "**. Full convention: [`docs/_meta/convention.md`](docs/_meta/convention.md).",
    "",
    buildUniversalRules(),
    "",
    buildProjectSpecificRules(config),
    "",
    buildDecisionTable(config),
    "",
  ].join("\n");
}
```

If the vendor uses a non-Markdown format (e.g., TOML, JSON, a custom syntax), adapt the
`join("\n")` rendering to produce the correct format. The shared `buildUniversalRules()`,
`buildProjectSpecificRules()`, and `buildDecisionTable()` helpers output Markdown-formatted
strings and may need adaptation for non-Markdown targets.

### 2. Register in `src/commands/sync.ts`

Add the new agent ID to the sync command's write logic:

```typescript
import { renderMyVendorFile } from "../generators/myvendor";

// Inside runSync():
if (config.agents.includes("myvendor")) {
  await fs.writeFile(rootFile(opts.root, "MYVENDOR.md"), renderMyVendorFile(config), "utf8");
}
```

### 3. Register in `src/linter/rules/ai-files-sync.ts`

Add an entry to the `checks` array so the linter validates the new vendor file:

```typescript
const checks: Array<{ agent: string; filename: string; render: () => string }> = [
  // ... existing entries ...
  {
    agent: "myvendor",
    filename: "MYVENDOR.md",
    render: () => renderMyVendorFile(ctx.config),
  },
];
```

Import the render function at the top of the file.

### 4. Add to `AgentId` union in `src/core/config.ts`

```typescript
export type AgentId = "claude" | "cursor" | "codex" | "gemini" | "myvendor";
```

This makes the type system enforce the new agent ID everywhere `AgentId` is used and allows
`beacon.config.json` to include `"myvendor"` in its `agents` array.

### 5. Update `beacon init` agent selection (optional)

In `src/commands/init.ts`, find the multi-select prompt for agent selection and add the new
vendor as an option with its display label.

### 6. Write tests

- Add a generator test in `tests/unit/generators/myvendor.test.ts` that calls
  `renderMyVendorFile(config)` with various configs and asserts the output contains expected strings.
- The `ai-files-sync.test.ts` integration test will catch sync failures for the new vendor
  automatically once it's registered.

## Example

See `src/generators/gemini.ts` + its registration in `src/commands/sync.ts` and
`src/linter/rules/ai-files-sync.ts` for a complete working example of a vendor implementation.
