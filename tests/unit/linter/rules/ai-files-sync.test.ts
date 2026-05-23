import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../../../src/commands/init";
import { rule } from "../../../../src/linter/rules/ai-files-sync";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-ai-sync-"));
  await runInit({
    root: tmp, yes: true, type: "library",
    with: [], without: [],
    agents: ["claude"], language: "en", existingFiles: "replace",
  });
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("ai-files-sync rule", () => {
  it("passes when generated files match the config", async () => {
    const findings = await rule.check({
      root: tmp,
      config: await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json")),
      files: [],
    });
    expect(findings).toEqual([]);
  });

  it("errors when CLAUDE.md was edited by hand", async () => {
    const claudePath = path.join(tmp, "CLAUDE.md");
    await fs.writeFile(claudePath, "manually edited\n");
    const findings = await rule.check({
      root: tmp,
      config: await fs.readJson(path.join(tmp, "docs", "_meta", "beacon.config.json")),
      files: [],
    });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]!.severity).toBe("error");
  });
});
