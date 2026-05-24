import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runAboutCommand } from "../../../src/commands/about";

let tmp: string;

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g;
const strip = (s: string) => s.replace(ANSI, "");

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-about-"));
});

afterEach(async () => fs.remove(tmp));

async function seedConfig(overrides: Record<string, unknown> = {}) {
  await fs.ensureDir(path.join(tmp, "docs", "_meta"));
  await fs.writeJson(path.join(tmp, "docs", "_meta", "beacon.config.json"), {
    version: "1.0",
    projectType: "library",
    categories: ["reference", "architecture", "adr", "plans", "backlog", "evaluations"],
    agents: ["claude", "cursor"],
    language: "en",
    ...overrides,
  });
}

describe("commands/about", () => {
  it("prints version, install path, node version, platform", async () => {
    const result = await runAboutCommand({
      root: tmp,
      version: "9.9.9",
      installPath: "/fake/path/cli.js",
    });
    expect(result.exitCode).toBe(0);
    expect(strip(result.output)).toContain("Beacon v9.9.9");
    expect(strip(result.output)).toContain("/fake/path/cli.js");
    expect(strip(result.output)).toContain(process.version);
    expect(strip(result.output)).toContain(process.platform);
  });

  it("gracefully handles a directory with no beacon config", async () => {
    const result = await runAboutCommand({
      root: tmp,
      version: "0.3.1",
      installPath: "x",
    });
    expect(strip(result.output)).toContain("No beacon config in this directory");
    expect(strip(result.output)).toContain("beacon init");
  });

  it("shows project type, categories, agents, language when config exists", async () => {
    await seedConfig();
    const result = await runAboutCommand({
      root: tmp,
      version: "0.3.1",
      installPath: "x",
    });
    expect(strip(result.output)).toContain("project type:");
    expect(strip(result.output)).toContain("library");
    expect(strip(result.output)).toContain("reference, architecture, adr");
    expect(strip(result.output)).toContain("claude, cursor");
  });

  it('reports "using defaults" when no doctor.thresholds set', async () => {
    await seedConfig();
    const result = await runAboutCommand({
      root: tmp,
      version: "0.3.1",
      installPath: "x",
    });
    expect(strip(result.output)).toContain("using defaults");
  });

  it("lists overrides when doctor.thresholds are present", async () => {
    await seedConfig({
      doctor: { thresholds: { stalePlanDays: 60, proposedAdrDays: 21 } },
    });
    const result = await runAboutCommand({
      root: tmp,
      version: "0.3.1",
      installPath: "x",
    });
    expect(strip(result.output)).toContain("2 overrides");
    expect(strip(result.output)).toContain("stalePlanDays = 60");
    expect(strip(result.output)).toContain("default: 30");
    expect(strip(result.output)).toContain("proposedAdrDays = 21");
  });

  it('reports "(none configured)" when no plugins are listed', async () => {
    await seedConfig();
    const result = await runAboutCommand({
      root: tmp,
      version: "0.4.0",
      installPath: "x",
    });
    expect(strip(result.output)).toContain("Plugins");
    expect(strip(result.output)).toContain("(none configured)");
  });

  it("lists each loaded plugin with check/rule counts", async () => {
    const pluginDir = path.join(tmp, "plugins");
    await fs.ensureDir(pluginDir);
    await fs.writeFile(
      path.join(pluginDir, "demo.mjs"),
      `export default {
        name: "demo-plugin",
        version: "1.2.3",
        checks: [{ name: "demo-check", area: "activity", check: () => [] }],
        rules: [
          { name: "demo-rule-1", severity: "warning", check: () => [] },
          { name: "demo-rule-2", severity: "warning", check: () => [] },
        ],
      };`,
    );
    await seedConfig({ plugins: ["./plugins/demo.mjs"] });
    const result = await runAboutCommand({
      root: tmp,
      version: "0.4.0",
      installPath: "x",
    });
    const clean = strip(result.output);
    expect(clean).toContain("demo-plugin");
    expect(clean).toContain("@1.2.3");
    expect(clean).toContain("1 check");
    expect(clean).toContain("2 rules");
    expect(clean).toContain("source: ./plugins/demo.mjs");
  });

  it("checks which AI files exist on disk", async () => {
    await seedConfig();
    await fs.writeFile(path.join(tmp, "CLAUDE.md"), "# CLAUDE\n");
    // Cursor files intentionally NOT created.
    const result = await runAboutCommand({
      root: tmp,
      version: "0.3.1",
      installPath: "x",
    });
    // CLAUDE.md should be marked present
    const claudeLine = result.output
      .split("\n")
      .find((l) => l.includes("CLAUDE.md"));
    expect(claudeLine).toBeDefined();
    expect(claudeLine).not.toContain("missing");

    // .cursorrules should be marked missing (configured but not on disk)
    const cursorLine = result.output
      .split("\n")
      .find((l) => l.includes(".cursorrules"));
    expect(cursorLine).toContain("missing");
    expect(cursorLine).toContain("beacon sync");
  });
});
