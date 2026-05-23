---
title: i18n for AI rule file templates
added: 2026-05-22
---

# i18n for AI rule file templates

## Why

Beacon V1 ships English-only AI rule file templates (CLAUDE.md, AGENTS.md, GEMINI.md,
.cursorrules, .cursor/rules/beacon.mdc). Teams whose working language is not English — Spanish,
Portuguese, French, Japanese, German, etc. — would benefit from AI rule files in their own
language, since AI agents tend to perform better when the instruction language matches the
codebase's predominant language. The `language` field already exists in `beacon.config.json`,
but V1 ignores it for templates and always outputs English.

(Spec §6.1 step 6 — "Choose docs language" prompt captures the field but defers implementation;
Spec §10, Post-1.0)

## Acceptance criteria

- [ ] `beacon.config.json` `language` field (already captured by `beacon init`) is respected when
  generating AI rule files — the file content is rendered in the configured language.
- [ ] Spanish (`es`) is the first non-English locale shipped, covering the full universal rules
  and project-specific rules.
- [ ] At least two additional locales (e.g., `pt`, `fr`) are provided via community contribution
  guidelines, with a clear translation template.
- [ ] `beacon sync` regenerates AI rule files in the correct language when re-run after a
  language change in `beacon.config.json`.
- [ ] `beacon lint`'s `ai-files-sync` rule validates the localized content (not hard-coded
  English strings) when checking sync status.
