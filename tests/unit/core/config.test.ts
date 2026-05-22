import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import {
  readConfig,
  writeConfig,
  configPath,
  type BeaconConfig,
} from "../../../src/core/config";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-config-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("config", () => {
  it("configPath resolves to docs/_meta/beacon.config.json under the project root", () => {
    expect(configPath("/some/project")).toBe(
      path.join("/some/project", "docs", "_meta", "beacon.config.json"),
    );
  });

  it("writeConfig creates the file and parent dirs", async () => {
    const cfg: BeaconConfig = {
      version: "1.0",
      projectType: "library",
      categories: ["reference", "architecture", "adr", "plans", "backlog", "evaluations"],
      agents: ["claude"],
      language: "en",
    };
    await writeConfig(tmp, cfg);
    const onDisk = await fs.readJson(configPath(tmp));
    expect(onDisk).toEqual(cfg);
  });

  it("readConfig returns the parsed config", async () => {
    const cfg: BeaconConfig = {
      version: "1.0",
      projectType: "web-app",
      categories: ["reference", "plans"],
      agents: ["claude", "cursor"],
      language: "en",
    };
    await writeConfig(tmp, cfg);
    const result = await readConfig(tmp);
    expect(result).toEqual(cfg);
  });

  it("readConfig throws a useful error when missing", async () => {
    await expect(readConfig(tmp)).rejects.toThrow(/beacon.config.json/);
  });

  it("writeConfig formats JSON with 2-space indent", async () => {
    const cfg: BeaconConfig = {
      version: "1.0",
      projectType: "library",
      categories: ["reference"],
      agents: ["claude"],
      language: "en",
    };
    await writeConfig(tmp, cfg);
    const raw = await fs.readFile(configPath(tmp), "utf8");
    expect(raw).toContain('  "version": "1.0"');
    expect(raw.endsWith("\n")).toBe(true);
  });
});
