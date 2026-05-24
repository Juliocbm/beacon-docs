---
title: v0.5 — plugin-contributed categories and AI agents
added: 2026-05-24
---

# v0.5 — Plugin-contributed categories and AI agents

## Why

[ADR-011](../adr/ADR-011-plugin-system-design.md) shipped the plugin system in v0.4.0 with **deliberately limited scope**: plugins can contribute `checks` and `rules` only. Categories (new folders + suffixes + archival policy) and AI agents (new generated rule-file formats) were deferred to v0.5+ to gather real plugin-authoring experience first.

After v0.4.0 sees adoption — at least 1-2 external plugins published, or enough internal authoring to surface friction — we should revisit whether these two extensions are needed and how to design them coherently.

## Acceptance criteria

- [ ] Decision documented (likely a new ADR): are plugin categories and agents in scope for v0.5? If yes, what are the constraints (e.g., can plugins override built-in categories? what happens on collision)?
- [ ] If shipping: extend `BeaconPlugin` contract with `categories?: CategoryDef[]` and `agents?: AgentDef[]`.
- [ ] If shipping: define `CategoryDef` (location, suffix, archivable, datePrefix, etc.) and `AgentDef` (file path, template-rendering hook).
- [ ] If shipping: integration into `beacon init` wizard — plugins' categories show up in the multiselect alongside built-ins.
- [ ] If shipping: integration into `beacon sync` — plugin agents get their files regenerated with the rest.
- [ ] If shipping: integration into `beacon enable/disable` — plugin categories are valid add-on targets.
- [ ] Update ADR-011 with a `superseded-by` link to the v0.5 ADR (or `null` confirming scope freeze).

## Open questions to resolve before starting

1. What happens when two plugins declare the same category name?
2. What happens when a plugin category conflicts with a built-in (e.g., plugin defines "reference")?
3. Can plugins override built-in category metadata (suffix, archivability)?
4. Should plugin-contributed agents be able to add to existing files (e.g., append to `CLAUDE.md`) or only create new files?
5. Migration story: a project's `categories` config lists plugin categories — what happens when the plugin is uninstalled?

## Not blocking on

This is **on hold pending v0.4.0 adoption signals**. Don't start until there's external usage to inform the design.
