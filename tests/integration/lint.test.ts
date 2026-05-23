import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../src/commands/init";
import { runLintCommand } from "../../src/commands/lint";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-lint-"));
  await runInit({
    root: tmp, yes: true, type: "library",
    with: [], without: [],
    agents: ["claude"], language: "en", existingFiles: "replace",
  });
});

afterEach(async () => fs.remove(tmp));

describe("beacon lint", () => {
  it("clean tree: exit code 0", async () => {
    const result = await runLintCommand({ root: tmp, strict: false, json: false });
    expect(result.exitCode).toBe(0);
  });

  it("misplaced file: exit code 1", async () => {
    await fs.outputFile(path.join(tmp, "docs", "reference", "thing.plan.md"), "# thing");
    const result = await runLintCommand({ root: tmp, strict: false, json: false });
    expect(result.exitCode).toBe(1);
  });

  it("--strict escalates warnings to errors", async () => {
    const long = Array.from({ length: 1100 }, (_, i) => `line ${i}`).join("\n");
    await fs.outputFile(path.join(tmp, "docs", "reference", "big.pattern.md"), long);
    const normal = await runLintCommand({ root: tmp, strict: false, json: false });
    expect(normal.exitCode).toBe(0);
    const strict = await runLintCommand({ root: tmp, strict: true, json: false });
    expect(strict.exitCode).toBe(1);
  });

  it("--json emits valid JSON", async () => {
    const result = await runLintCommand({ root: tmp, strict: false, json: true });
    expect(() => JSON.parse(result.output)).not.toThrow();
  });
});
