# beacon-plugin-example

Reference plugin demonstrating the Beacon v0.4 plugin contract.

## What it contributes

| Kind | Name | What it does |
|---|---|---|
| doctor check (snapshots area) | `tiny-evals` | Flags evaluation files whose body is < 200 chars |
| lint rule (warning) | `no-inline-todo` | Flags any non-README doc containing a literal `TODO:` line |

Both have `--explain` text so they show up in `beacon doctor --explain` and `beacon lint --explain` lists alongside built-ins.

## Trying it out

From any Beacon-managed project:

```bash
# 1. Reference the plugin in beacon.config.json
cat <<'JSON' > docs/_meta/beacon.config.json.tmp
{
  "version": "1.0",
  "projectType": "library",
  "categories": ["reference", "architecture", "adr", "plans", "backlog", "evaluations"],
  "agents": ["claude"],
  "language": "en",
  "plugins": ["./path/to/beacon-docs/examples/plugin-example/index.mjs"]
}
JSON
mv docs/_meta/beacon.config.json.tmp docs/_meta/beacon.config.json

# 2. Run doctor / lint
beacon doctor                  # plugin checks fire alongside built-ins
beacon lint                    # plugin rules fire alongside built-ins
beacon doctor --explain tiny-evals
beacon lint --explain no-inline-todo
```

## Plugin contract — minimal version

```js
// my-plugin/index.mjs
export default {
  name: "my-plugin",       // required, unique
  version: "0.1.0",        // optional but recommended
  checks: [/* Check[] */], // optional doctor checks
  rules:  [/* Rule[]  */], // optional lint rules
  explain: {               // optional --explain entries by name
    "my-check": { summary: "...", why: "...", fix: "..." },
  },
};
```

See `index.mjs` in this folder for a working reference, and [ADR-011](../../docs/adr/ADR-011-plugin-system-design.md) for the full design rationale.
