import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-init-i-"));
});

afterEach(async () => {
  await fs.remove(tmp);
  vi.restoreAllMocks();
});

describe("beacon init (interactive)", () => {
  it("walks the user through the wizard and produces a config", async () => {
    vi.doMock("@clack/prompts", () => ({
      intro: vi.fn(),
      outro: vi.fn(),
      note: vi.fn(),
      select: vi.fn().mockResolvedValueOnce("library"),
      multiselect: vi
        .fn()
        // categories
        .mockResolvedValueOnce(["reference", "adr", "plans"])
        // agents
        .mockResolvedValueOnce(["claude", "cursor"]),
      confirm: vi.fn().mockResolvedValue(false), // do not seed reference
      isCancel: vi.fn().mockReturnValue(false),
      cancel: vi.fn(),
      log: { info: vi.fn(), warn: vi.fn(), success: vi.fn() },
    }));

    const { runInitInteractive } = await import("../../src/commands/init");
    const cfg = await runInitInteractive({ root: tmp });
    expect(cfg.projectType).toBe("library");
    expect(cfg.categories).toEqual(["reference", "adr", "plans"]);
    expect(cfg.agents).toEqual(["claude", "cursor"]);
    expect(await fs.pathExists(path.join(tmp, "docs", "plans"))).toBe(true);
  });
});
