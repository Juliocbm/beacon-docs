---
description: Initialize beacon-docs in the current project. Inspects the repo, recommends a project type and add-ons, then runs beacon init. Use when the user wants to set up Beacon documentation in a project that doesn't yet have it.
allowed-tools:
  - Bash
  - Read
  - Glob
---

# /beacon:beacon-init

> **T4 implementation pending.** Final logic owned by T4 of the [claude-code-plugin-mvp plan](https://github.com/Juliocbm/beacon-docs/blob/main/docs/plans/claude-code-plugin-mvp.plan.md).

## What this skill does (target behavior)

1. Verify `beacon-docs` CLI is installed (`bash: which beacon`). If missing, recommend `npm install -g beacon-docs`.
2. Inspect the repo to recommend a project type:
   - Check `package.json` for hints (`type: module`, `bin` entries → cli-tool; `dependencies.react` → web-app, etc.)
   - Check folder structure (`apps/` + `packages/` → monorepo, etc.)
3. Inspect dependencies for add-on hints (stripe → compliance; @prisma/client → architecture; etc.)
4. Propose a `beacon init --yes --type=<type> --with=<addons> --agents=<agents>` invocation.
5. Confirm with the user, then execute via `bash`.

(Argument handling, project-type inference rules, and exact prompts come in T4.)
