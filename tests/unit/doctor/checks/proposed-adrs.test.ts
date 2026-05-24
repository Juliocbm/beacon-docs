import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { check as proposedAdrs } from "../../../../src/doctor/checks/proposed-adrs";
import { walkDocs } from "../../../../src/linter/walker";
import type { CheckContext } from "../../../../src/doctor/types";

let tmp: string;
const NOW = Date.UTC(2026, 4, 23);
const DAY = 24 * 60 * 60 * 1000;

async function makeContext(root: string): Promise<CheckContext> {
  const files = await walkDocs(root);
  return {
    root,
    config: {
      version: "1.0",
      projectType: "library",
      categories: ["adr"],
      agents: ["claude"],
      language: "en",
    },
    files,
    now: NOW,
  };
}

async function writeAdr(
  root: string,
  filename: string,
  frontmatter: Record<string, string>,
  ageDays?: number,
) {
  const dir = path.join(root, "docs", "adr");
  await fs.ensureDir(dir);
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, `---\n${fm}\n---\n\n# ${filename}\n`);
  if (ageDays !== undefined) {
    const mtime = (NOW - ageDays * DAY) / 1000;
    await fs.utimes(filePath, mtime, mtime);
  }
}

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-proposed-adrs-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("doctor/checks/proposed-adrs", () => {
  it("flags proposed ADRs older than 14 days (via frontmatter date)", async () => {
    await writeAdr(tmp, "ADR-001-foo.md", { status: "proposed", date: "2026-05-01" });
    const ctx = await makeContext(tmp);
    const findings = await proposedAdrs.check(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.target).toBe("docs/adr/ADR-001-foo.md");
    expect(findings[0]?.observation).toContain("22 days");
  });

  it("does not flag accepted ADRs", async () => {
    await writeAdr(tmp, "ADR-002-bar.md", { status: "accepted", date: "2025-01-01" });
    const ctx = await makeContext(tmp);
    const findings = await proposedAdrs.check(ctx);
    expect(findings).toEqual([]);
  });

  it("does not flag rejected or superseded ADRs", async () => {
    await writeAdr(tmp, "ADR-003-foo.md", { status: "rejected", date: "2025-01-01" });
    await writeAdr(tmp, "ADR-004-bar.md", { status: "superseded", date: "2025-01-01" });
    const ctx = await makeContext(tmp);
    const findings = await proposedAdrs.check(ctx);
    expect(findings).toEqual([]);
  });

  it("does not flag proposed ADRs younger than 14 days", async () => {
    await writeAdr(tmp, "ADR-005-fresh.md", { status: "proposed", date: "2026-05-15" });
    const ctx = await makeContext(tmp);
    const findings = await proposedAdrs.check(ctx);
    expect(findings).toEqual([]);
  });

  it("falls back to file mtime when frontmatter `date` is missing", async () => {
    await writeAdr(tmp, "ADR-006-no-date.md", { status: "proposed" }, 20);
    const ctx = await makeContext(tmp);
    const findings = await proposedAdrs.check(ctx);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.observation).toContain("20 days");
  });

  it("ignores README in adr/", async () => {
    await fs.ensureDir(path.join(tmp, "docs", "adr"));
    await fs.writeFile(path.join(tmp, "docs", "adr", "README.md"), "# ADRs\n");
    const ctx = await makeContext(tmp);
    const findings = await proposedAdrs.check(ctx);
    expect(findings).toEqual([]);
  });
});
