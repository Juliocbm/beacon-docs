import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { runInit } from "../../src/commands/init";
import { runNew } from "../../src/commands/new";
import { runArchive } from "../../src/commands/archive";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-archive-"));
  await runInit({
    root: tmp, yes: true, type: "web-app",
    with: [], without: [],
    agents: ["claude"], language: "en", existingFiles: "replace",
  });
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("beacon archive", () => {
  it("moves a plan to _archive/", async () => {
    const file = await runNew({ root: tmp, type: "plan", slug: "billing", today: "2026-05-22" });
    let body = await fs.readFile(file, "utf8");
    body = body.replace(/- \[ \]/g, "- [x]");
    await fs.writeFile(file, body);

    await runArchive({ root: tmp, type: "plan", slug: "billing", force: false });

    expect(await fs.pathExists(file)).toBe(false);
    expect(await fs.pathExists(path.join(tmp, "docs", "plans", "_archive", "billing.plan.md"))).toBe(true);
  });

  it("warns when unchecked TODOs remain but proceeds with --force", async () => {
    const file = await runNew({ root: tmp, type: "plan", slug: "billing", today: "2026-05-22" });
    const result = await runArchive({ root: tmp, type: "plan", slug: "billing", force: true });
    expect(result.warnings).toContain("Unchecked TODOs remain in the document.");
    expect(await fs.pathExists(file)).toBe(false);
  });

  it("refuses to archive non-archivable types", async () => {
    await runNew({ root: tmp, type: "eval", slug: "audit", today: "2026-05-22" });
    await expect(
      runArchive({ root: tmp, type: "eval", slug: "audit", force: true }),
    ).rejects.toThrow(/cannot be archived/i);
  });

  it("errors if the target file does not exist", async () => {
    await expect(
      runArchive({ root: tmp, type: "plan", slug: "ghost", force: false }),
    ).rejects.toThrow(/not found/i);
  });
});
