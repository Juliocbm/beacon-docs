import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../src/commands/init";
import { runDoctorCommand } from "../../src/commands/doctor";
import { runLintCommand } from "../../src/commands/lint";

let tmp: string;

async function writePlugin(relPath: string, content: string): Promise<void> {
  const full = path.join(tmp, relPath);
  await fs.ensureDir(path.dirname(full));
  await fs.writeFile(full, content, "utf8");
}

async function setPlugins(sources: string[]): Promise<void> {
  const cfgPath = path.join(tmp, "docs", "_meta", "beacon.config.json");
  const cfg = (await fs.readJson(cfgPath)) as Record<string, unknown>;
  cfg.plugins = sources;
  await fs.writeJson(cfgPath, cfg, { spaces: 2 });
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-plugins-int-"));
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
});

afterEach(async () => fs.remove(tmp));

describe("beacon doctor + plugins", () => {
  it("includes plugin-contributed checks in the run", async () => {
    await writePlugin(
      "plugins/test-plugin.mjs",
      `
      export default {
        name: "test-plugin",
        checks: [{
          name: "always-fires",
          area: "activity",
          check: () => [{
            area: "activity",
            check: "always-fires",
            target: "synthetic",
            observation: "I fire on every run.",
            suggestion: "Disable me by removing the plugin from beacon.config.json.",
          }],
        }],
      };
    `,
    );
    await setPlugins(["./plugins/test-plugin.mjs"]);

    const result = await runDoctorCommand({
      root: tmp,
      strict: false,
      json: false,
    });
    expect(result.pluginErrors).toEqual([]);
    expect(result.output).toContain("always-fires");
    expect(result.output).toContain("I fire on every run.");
  });

  it("surfaces plugin load errors without crashing the run", async () => {
    await setPlugins(["./plugins/does-not-exist.mjs"]);
    const result = await runDoctorCommand({
      root: tmp,
      strict: false,
      json: false,
    });
    expect(result.exitCode).toBe(0); // built-in checks still ran on a clean tree
    expect(result.pluginErrors.length).toBeGreaterThan(0);
    expect(result.pluginErrors[0]).toMatch(/Plugin "\.\/plugins\/does-not-exist\.mjs" failed to load/);
  });
});

describe("beacon lint + plugins", () => {
  it("includes plugin-contributed rules in the run", async () => {
    await writePlugin(
      "plugins/lint-plugin.mjs",
      `
      export default {
        name: "lint-plugin",
        rules: [{
          name: "no-foo",
          severity: "warning",
          check: () => [{
            severity: "warning",
            rule: "no-foo",
            message: "Found a forbidden 'foo' somewhere.",
          }],
        }],
      };
    `,
    );
    await setPlugins(["./plugins/lint-plugin.mjs"]);

    const result = await runLintCommand({
      root: tmp,
      strict: false,
      json: false,
    });
    expect(result.pluginErrors).toEqual([]);
    expect(result.output).toContain("no-foo");
    expect(result.output).toContain("forbidden 'foo'");
  });

  it("--strict escalates plugin warnings to exit 1", async () => {
    await writePlugin(
      "plugins/warning-plugin.mjs",
      `
      export default {
        name: "warning-plugin",
        rules: [{
          name: "always-warn",
          severity: "warning",
          check: () => [{ severity: "warning", rule: "always-warn", message: "noise" }],
        }],
      };
    `,
    );
    await setPlugins(["./plugins/warning-plugin.mjs"]);
    const lenient = await runLintCommand({ root: tmp, strict: false, json: false });
    expect(lenient.exitCode).toBe(0);
    const strict = await runLintCommand({ root: tmp, strict: true, json: false });
    expect(strict.exitCode).toBe(1);
  });
});
