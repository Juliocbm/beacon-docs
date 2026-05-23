---
title: beacon serve — local docs preview server
added: 2026-05-22
---

# beacon serve — local docs preview server

## Why

Beacon manages documentation structure and naming but deliberately avoids being a documentation
site generator (spec §3 non-goals: "A documentation site generator (use Astro Starlight, Vitepress,
etc. on top)"). However, previewing the docs locally still requires setting up and running a
separate tool (Vitepress, Astro Starlight, or similar), which creates friction — especially for
new contributors who just want to read and navigate the docs without configuring a site builder.

A lightweight `beacon serve` command that renders the Beacon docs tree as a browsable local website
— using a minimal built-in renderer, no user configuration required — would lower this barrier
significantly. It would also enable link validation and cross-reference checking in the preview.

(Spec §10, Post-1.0: "`beacon serve`: local dev server for docs preview")

## Acceptance criteria

- [ ] `beacon serve` starts a local HTTP server (default port 4000) that renders the `docs/` tree
  as navigable HTML with no user configuration.
- [ ] The rendered site shows the category structure in a sidebar, renders Markdown to HTML, and
  highlights frontmatter metadata (status, date, ADR number).
- [ ] Live reload: editing a doc in the text editor updates the browser within 1 second.
- [ ] The server validates internal links between docs and flags broken references in the
  terminal output (not as a hard error — informational).
- [ ] `beacon serve` is a dev-only command; it is not intended to replace a production docs site.
  The output HTML is not optimized and has no SEO headers.
