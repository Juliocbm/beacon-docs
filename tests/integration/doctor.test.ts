import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../src/commands/init";
import { runDoctorCommand } from "../../src/commands/doctor";
import type { Finding } from "../../src/doctor/types";

let tmp: string;
const DAY = 24 * 60 * 60 * 1000;

async function ageFile(filePath: string, daysAgo: number) {
  const t = (Date.now() - daysAgo * DAY) / 1000;
  await fs.utimes(filePath, t, t);
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-doctor-"));
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

describe("beacon doctor", () => {
  it("clean tree: exit 0 with all-clear output", async () => {
    const result = await runDoctorCommand({ root: tmp, strict: false, json: false });
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("All checks passed.");
  });

  it("clean tree + --strict: still exit 0", async () => {
    const result = await runDoctorCommand({ root: tmp, strict: true, json: false });
    expect(result.exitCode).toBe(0);
  });

  it("stale plan + proposed ADR: 2 findings, exit 0 by default", async () => {
    const stalePlan = path.join(tmp, "docs", "plans", "shipping.plan.md");
    await fs.outputFile(stalePlan, "# Shipping plan\n");
    await ageFile(stalePlan, 45);

    const oldAdr = path.join(tmp, "docs", "adr", "ADR-099-foo.md");
    await fs.outputFile(
      oldAdr,
      `---\nstatus: proposed\ndate: ${new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10)}\n---\n\n# ADR-099\n`,
    );

    const result = await runDoctorCommand({ root: tmp, strict: false, json: false });
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("stale-plans");
    expect(result.output).toContain("proposed-adrs");
    expect(result.output).toContain("2 findings across 2 areas");
  });

  it("findings + --strict: exit 1", async () => {
    const stalePlan = path.join(tmp, "docs", "plans", "old.plan.md");
    await fs.outputFile(stalePlan, "# Old plan\n");
    await ageFile(stalePlan, 45);

    const result = await runDoctorCommand({ root: tmp, strict: true, json: false });
    expect(result.exitCode).toBe(1);
  });

  it("--json: emits parseable JSON array of findings", async () => {
    const stalePlan = path.join(tmp, "docs", "plans", "another-old.plan.md");
    await fs.outputFile(stalePlan, "# old\n");
    await ageFile(stalePlan, 45);

    const result = await runDoctorCommand({ root: tmp, strict: false, json: true });
    expect(result.exitCode).toBe(0);
    const parsed = JSON.parse(result.output) as Finding[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(1);
    expect(parsed.some((f) => f.check === "stale-plans")).toBe(true);
  });
});
