import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runDoctor } from "../../../src/doctor/runner";
import type { Check, Finding } from "../../../src/doctor/types";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-doctor-runner-"));
  await fs.ensureDir(path.join(tmp, "docs", "_meta"));
  await fs.writeJson(path.join(tmp, "docs", "_meta", "beacon.config.json"), {
    version: "1.0",
    projectType: "library",
    categories: ["reference", "architecture", "adr", "plans", "backlog", "evaluations"],
    agents: ["claude"],
    language: "en",
  });
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("doctor/runner", () => {
  it("returns zero findings when no checks are registered", async () => {
    const result = await runDoctor({ root: tmp, checks: [] });
    expect(result.findings).toEqual([]);
    expect(result.areaCounts).toEqual({
      activity: 0,
      decisions: 0,
      snapshots: 0,
      balance: 0,
    });
  });

  it("aggregates findings from multiple checks", async () => {
    const fake1: Check = {
      name: "fake-activity",
      area: "activity",
      check: () => [
        { area: "activity", check: "fake-activity", observation: "obs1", suggestion: "fix1" },
      ],
    };
    const fake2: Check = {
      name: "fake-decisions",
      area: "decisions",
      check: () => [
        { area: "decisions", check: "fake-decisions", observation: "obs2", suggestion: "fix2" },
        { area: "decisions", check: "fake-decisions", observation: "obs3", suggestion: "fix3" },
      ],
    };
    const result = await runDoctor({ root: tmp, checks: [fake1, fake2] });
    expect(result.findings).toHaveLength(3);
    expect(result.areaCounts.activity).toBe(1);
    expect(result.areaCounts.decisions).toBe(2);
    expect(result.areaCounts.snapshots).toBe(0);
    expect(result.areaCounts.balance).toBe(0);
  });

  it("passes a frozen `now` timestamp into the check context", async () => {
    const frozen = Date.UTC(2026, 4, 23);
    let seen: number | undefined;
    const probe: Check = {
      name: "probe",
      area: "activity",
      check: (ctx) => {
        seen = ctx.now;
        return [];
      },
    };
    await runDoctor({ root: tmp, checks: [probe], now: frozen });
    expect(seen).toBe(frozen);
  });

  it("resolves thresholds from config.doctor.thresholds (overrides win)", async () => {
    await fs.writeJson(path.join(tmp, "docs", "_meta", "beacon.config.json"), {
      version: "1.0",
      projectType: "library",
      categories: ["reference", "architecture", "adr", "plans", "backlog", "evaluations"],
      agents: ["claude"],
      language: "en",
      doctor: { thresholds: { stalePlanDays: 60, proposedAdrDays: 21 } },
    });
    let seen: { stalePlanDays?: number; proposedAdrDays?: number; oldEvalMonths?: number } | undefined;
    const probe: Check = {
      name: "threshold-probe",
      area: "activity",
      check: (ctx) => {
        seen = ctx.thresholds;
        return [];
      },
    };
    await runDoctor({ root: tmp, checks: [probe] });
    expect(seen?.stalePlanDays).toBe(60);
    expect(seen?.proposedAdrDays).toBe(21);
    // Unset field falls back to default.
    expect(seen?.oldEvalMonths).toBe(6);
  });

  it("ignores invalid threshold overrides (negative, NaN, non-number)", async () => {
    await fs.writeJson(path.join(tmp, "docs", "_meta", "beacon.config.json"), {
      version: "1.0",
      projectType: "library",
      categories: ["reference", "architecture", "adr", "plans", "backlog", "evaluations"],
      agents: ["claude"],
      language: "en",
      doctor: { thresholds: { stalePlanDays: -5, proposedAdrDays: "bogus" as unknown as number } },
    });
    let seen: { stalePlanDays?: number; proposedAdrDays?: number } | undefined;
    const probe: Check = {
      name: "threshold-probe",
      area: "activity",
      check: (ctx) => {
        seen = ctx.thresholds;
        return [];
      },
    };
    await runDoctor({ root: tmp, checks: [probe] });
    expect(seen?.stalePlanDays).toBe(30); // default
    expect(seen?.proposedAdrDays).toBe(14); // default
  });

  it("awaits async checks", async () => {
    const asyncCheck: Check = {
      name: "async-probe",
      area: "balance",
      check: async () =>
        new Promise<Finding[]>((resolve) =>
          setTimeout(
            () =>
              resolve([
                {
                  area: "balance",
                  check: "async-probe",
                  observation: "async",
                  suggestion: "fix",
                },
              ]),
            5,
          ),
        ),
    };
    const result = await runDoctor({ root: tmp, checks: [asyncCheck] });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.observation).toBe("async");
  });
});
