# Writing a Beacon plugin

> Pattern doc for v0.4+. Reference plugin: [`examples/plugin-example/`](../../examples/plugin-example/).

A Beacon plugin is a JavaScript module that exports a `BeaconPlugin` object. It can contribute custom **doctor checks** and **lint rules** that fire alongside the built-ins.

## The minimal plugin

```js
// my-plugin/index.mjs
export default {
  name: "my-plugin",
  version: "0.1.0",
  checks: [],   // optional doctor checks
  rules:  [],   // optional lint rules
};
```

That's a valid (but empty) plugin. Add a check or a rule to make it useful.

## Adding a doctor check

```js
const myCheck = {
  name: "no-shouting-titles",        // unique name
  area: "activity",                   // one of: activity | decisions | snapshots | balance
  async check(ctx) {
    const findings = [];
    for (const file of ctx.files) {
      if (file.isReadme || file.isArchived) continue;
      const body = await fs.readFile(file.absolutePath, "utf8");
      const h1 = body.split("\n").find((l) => l.startsWith("# "));
      if (h1 && h1 === h1.toUpperCase()) {
        findings.push({
          area: "activity",
          check: "no-shouting-titles",
          target: `docs/${file.relativePath}`,
          observation: "H1 is all uppercase — looks like shouting.",
          suggestion: "Use sentence case for H1s.",
        });
      }
    }
    return findings;
  },
};

export default { name: "my-plugin", checks: [myCheck] };
```

The `ctx` object gives you:
- `ctx.root` — absolute project root
- `ctx.config` — the parsed `BeaconConfig`
- `ctx.files` — array of `DocFile` (path, category, isReadme, isArchived, etc.)
- `ctx.now` — reference timestamp (use this for "X days ago" so tests can freeze time)
- `ctx.thresholds` — resolved doctor thresholds (use these for tunable numeric limits)

## Adding a lint rule

```js
const myRule = {
  name: "no-emoji-in-paths",
  severity: "warning",                // error | warning | suggestion
  check(ctx) {
    const findings = [];
    for (const file of ctx.files) {
      if (/[\p{Emoji}]/u.test(file.relativePath)) {
        findings.push({
          severity: "warning",
          rule: "no-emoji-in-paths",
          file: `docs/${file.relativePath}`,
          message: "Filename contains emoji — break some shells/CI tooling.",
        });
      }
    }
    return findings;
  },
};

export default { name: "my-plugin", rules: [myRule] };
```

## Documenting checks and rules for `--explain`

```js
export default {
  name: "my-plugin",
  checks: [myCheck],
  rules: [myRule],
  explain: {
    "no-shouting-titles": {
      summary: "Flags H1 headings that are entirely uppercase.",
      why: "All-caps reads as shouting and breaks tone consistency.",
      fix: "Use sentence case: `# My document title`, not `# MY DOCUMENT TITLE`.",
    },
    "no-emoji-in-paths": {
      summary: "Flags filenames that contain emoji characters.",
      why: "Emoji in paths confuse shell globs, git LFS, and some CI tools.",
      fix: "Rename the file to use only kebab-case ASCII characters.",
    },
  },
};
```

These show up when users run `beacon doctor --explain no-shouting-titles` or `beacon lint --explain no-emoji-in-paths`.

## Wiring a plugin into a project

In `docs/_meta/beacon.config.json`:

```json
{
  "plugins": [
    "beacon-plugin-corporate",       // installed via npm
    "./scripts/internal-checks.mjs"  // path relative to project root
  ]
}
```

Both forms work. npm packages must be installed in the project's `node_modules`.

## Verifying it loads

```bash
beacon about
# Shows:
#   Plugins
#     ✔ my-plugin@0.1.0 (1 check, 1 rule)
#       source: beacon-plugin-corporate

beacon doctor --explain no-shouting-titles
# Renders the explain entry inline
```

If the plugin fails to load (missing package, invalid shape, syntax error), `beacon doctor` and `beacon lint` will warn to stderr but keep running with the built-ins.

## Publishing to npm

Convention:
- Package name: `beacon-plugin-<scope>` (e.g., `beacon-plugin-monorepo`, `beacon-plugin-compliance`)
- Add `"beacon-plugin"` to `keywords` in `package.json` for discoverability
- Peer-depend on `beacon-docs` with the major version range you tested against

```json
{
  "name": "beacon-plugin-compliance",
  "type": "module",
  "main": "./index.mjs",
  "peerDependencies": { "beacon-docs": "^0.4.0" },
  "keywords": ["beacon", "beacon-plugin", "compliance"]
}
```

## See also

- [ADR-011](../adr/ADR-011-plugin-system-design.md) — design rationale, alternatives considered
- [`examples/plugin-example/`](../../examples/plugin-example/) — full working reference with tests
