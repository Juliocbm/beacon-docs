---
title: Plugin system for custom categories
added: 2026-05-22
---

# Plugin system for custom categories

## Why

The current add-on model covers six categories (`compliance`, `business`, `modules`,
`integrations`, `operations`, `roadmaps`) that cover the majority of project types. But
organizations with domain-specific documentation needs — regulated industries, hardware projects,
data science workflows, game development — may need categories that aren't in the Beacon standard
set. Today, their only option is to add the folder manually (bypassing the convention enforcement)
or to fork Beacon.

A plugin system would let teams publish npm packages that register custom categories, document
types, AI rule snippets, and frontmatter templates. This brings the extensibility of a platform
without coupling Beacon's core to niche use cases.

(Spec §3, Non-goals V1 — explicit Post-1.0 item; Spec §10)

## Acceptance criteria

- [ ] A Beacon plugin is an npm package that exports a `BeaconPlugin` interface with: category
  name, metadata (suffix, location, archivable, datePrefix), AI rule snippet, frontmatter EJS
  template, and optional README template.
- [ ] Plugins are registered in `beacon.config.json` under a `plugins` array (npm package names).
- [ ] `beacon init`, `beacon new`, `beacon lint`, and `beacon sync` all respect categories
  contributed by plugins.
- [ ] Plugin categories are validated identically to built-in categories by `beacon lint`.
- [ ] A plugin's AI rule snippet is injected into the project-specific layer of generated AI rule
  files when the plugin category is enabled.
- [ ] At least one example plugin (`beacon-plugin-data-science`) is published to npm alongside
  this feature.
