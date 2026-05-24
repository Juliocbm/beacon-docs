import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runSync } from "../../src/commands/sync";
import { runInit } from "../../src/commands/init";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-sync-"));
  await runInit({
    root: tmp,
    yes: true,
    type: "web-app",
    with: [],
    without: [],
    agents: ["claude", "cursor", "codex", "gemini"],
    language: "en",
    existingFiles: "replace",
  });
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("beacon sync", () => {
  it("generates CLAUDE.md when claude is in agents", async () => {
    await runSync({ root: tmp, silent: true });
    expect(await fs.pathExists(path.join(tmp, "CLAUDE.md"))).toBe(true);
    const md = await fs.readFile(path.join(tmp, "CLAUDE.md"), "utf8");
    expect(md).toContain("Universal rules");
  });

  it("generates AGENTS.md when codex is in agents", async () => {
    await runSync({ root: tmp, silent: true });
    expect(await fs.pathExists(path.join(tmp, "AGENTS.md"))).toBe(true);
  });

  it("generates GEMINI.md when gemini is in agents", async () => {
    await runSync({ root: tmp, silent: true });
    expect(await fs.pathExists(path.join(tmp, "GEMINI.md"))).toBe(true);
  });

  it("generates .cursorrules and .cursor/rules/beacon.mdc when cursor is in agents", async () => {
    await runSync({ root: tmp, silent: true });
    expect(await fs.pathExists(path.join(tmp, ".cursorrules"))).toBe(true);
    expect(await fs.pathExists(path.join(tmp, ".cursor", "rules", "beacon.mdc"))).toBe(true);
  });

  it("skips vendors not in agents list", async () => {
    // Re-init with only claude
    await fs.remove(tmp);
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-sync-"));
    await runInit({
      root: tmp,
      yes: true,
      type: "library",
      with: [],
      without: [],
      agents: ["claude"],
      language: "en",
      existingFiles: "replace",
    });
    await runSync({ root: tmp, silent: true });
    expect(await fs.pathExists(path.join(tmp, "CLAUDE.md"))).toBe(true);
    expect(await fs.pathExists(path.join(tmp, "AGENTS.md"))).toBe(false);
    expect(await fs.pathExists(path.join(tmp, "GEMINI.md"))).toBe(false);
    expect(await fs.pathExists(path.join(tmp, ".cursorrules"))).toBe(false);
  });

  it("is idempotent — repeated runs produce identical files", async () => {
    await runSync({ root: tmp, silent: true });
    const a = await fs.readFile(path.join(tmp, "CLAUDE.md"), "utf8");
    await runSync({ root: tmp, silent: true });
    const b = await fs.readFile(path.join(tmp, "CLAUDE.md"), "utf8");
    expect(a).toBe(b);
  });
});
