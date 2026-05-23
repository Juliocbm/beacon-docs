---
title: VS Code extension with inline lint warnings
added: 2026-05-22
---

# VS Code extension with inline lint warnings

## Why

`beacon lint` is designed for CI — it runs on the full docs tree and prints a summary. But
developers editing a document in VS Code don't get lint feedback until they commit and see CI
fail. This creates a friction loop: create a file in the wrong location, commit, wait for CI,
fix, commit again.

A VS Code extension that surfaces Beacon lint warnings inline — similar to ESLint or markdownlint
in the editor — would catch convention violations at the moment they're introduced, before any
commit. It would also make Beacon more discoverable: developers opening an unfamiliar Beacon
project would immediately see guidance about why a document is in the wrong location.

(Spec §10, Post-1.0: "VSCode extension surfacing lint warnings inline")

## Acceptance criteria

- [ ] The extension detects a Beacon project by the presence of `docs/_meta/beacon.config.json`.
- [ ] Opening or saving a Markdown file in the `docs/` tree triggers a lint check against that
  file (not the whole tree, for performance).
- [ ] Violations are shown as VS Code diagnostic warnings/errors in the Problems panel and as
  inline squiggles on the offending filename or line.
- [ ] A CodeAction (quick-fix) is provided for at least the `kebab-case` and `suffix-location`
  rules (rename file, move file to correct location).
- [ ] The extension uses the locally installed `beacon-docs` package (from `node_modules/.bin/beacon`)
  rather than bundling its own copy of the linter.
- [ ] Published to the VS Code Marketplace under the `beacon-docs` publisher.
