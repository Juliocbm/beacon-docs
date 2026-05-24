import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../src/commands/init";
import { runDoctorCommand } from "../../src/commands/doctor";
import { runLintCommand } from "../../src/commands/lint";

let tmp: string;

const EXAMPLE_PLUGIN_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "examples",
  "plugin-example",
  "index.mjs",
);

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-example-plugin-"));
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
  const cfgPath = path.join(tmp, "docs", "_meta", "beacon.config.json");
  const cfg = (await fs.readJson(cfgPath)) as Record<string, unknown>;
  cfg.plugins = [EXAMPLE_PLUGIN_PATH];
  await fs.writeJson(cfgPath, cfg, { spaces: 2 });
});

afterEach(async () => fs.remove(tmp));

describe("examples/plugin-example end-to-end", () => {
  it("tiny-evals check fires for too-short evaluation files", async () => {
    await fs.outputFile(
      path.join(tmp, "docs", "evaluations", "2026-05-24-stub.eval.md"),
      "# Stub\n", // 8 chars body — well under 200
    );
    const result = await runDoctorCommand({ root: tmp, strict: false, json: false });
    expect(result.pluginErrors).toEqual([]);
    expect(result.output).toContain("tiny-evals");
    expect(result.output).toContain("Evaluation body is only");
  });

  it("tiny-evals does not fire when the eval is substantive", async () => {
    const longBody = "# Findings\n\n" + "Some real content. ".repeat(20);
    await fs.outputFile(
      path.join(tmp, "docs", "evaluations", "2026-05-24-real.eval.md"),
      longBody,
    );
    const result = await runDoctorCommand({ root: tmp, strict: false, json: false });
    expect(result.output).not.toContain("tiny-evals");
  });

  it("no-inline-todo rule fires on a literal TODO: line", async () => {
    await fs.outputFile(
      path.join(tmp, "docs", "reference", "scratch.pattern.md"),
      "# Scratch\n\nTODO: figure this out later\n",
    );
    const result = await runLintCommand({ root: tmp, strict: false, json: false });
    expect(result.pluginErrors).toEqual([]);
    expect(result.output).toContain("no-inline-todo");
  });

  it("no-inline-todo + --strict exits 1 (warning escalation)", async () => {
    await fs.outputFile(
      path.join(tmp, "docs", "reference", "scratch.pattern.md"),
      "# Scratch\n\nTODO: figure this out later\n",
    );
    const result = await runLintCommand({ root: tmp, strict: true, json: false });
    expect(result.exitCode).toBe(1);
  });
});
