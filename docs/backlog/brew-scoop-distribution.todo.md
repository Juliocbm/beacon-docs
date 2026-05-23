---
title: Homebrew and Scoop distribution
added: 2026-05-22
---

# Homebrew and Scoop distribution

## Why

Beacon is published on npm (`npm install -g beacon-docs` or `npx beacon-docs`), which is ideal
for Node.js developers. But developers who work in Go, Python, Ruby, Rust, or other ecosystems
may not have Node installed, or may prefer not to install a global npm package. Homebrew (macOS/
Linux) and Scoop (Windows) are the package managers these developers are already using for CLI
tools, and they expect to install CLIs that way.

Distribution via Homebrew and Scoop would remove the Node.js requirement for end users by bundling
Beacon as a self-contained binary (using `pkg`, `bun build --compile`, or similar). This
significantly widens the addressable audience.

(Spec §3, Non-goals V1; Spec §10, Post-1.0)

## Acceptance criteria

- [ ] `beacon` is distributed via a Homebrew tap (`brew install beacon-docs/tap/beacon`) with a
  self-contained binary that does not require Node.js to be installed.
- [ ] A Scoop manifest is published for Windows users (`scoop install beacon`).
- [ ] The binary build is automated in CI (GitHub Actions) on every release tag.
- [ ] The self-contained binary passes the full integration test suite on macOS, Linux (x64 +
  arm64), and Windows.
- [ ] The `operations/release-process.guide.md` runbook is updated to include the binary
  build and Homebrew tap update steps.
