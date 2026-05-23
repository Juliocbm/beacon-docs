import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { rule as duplicateTitles } from "../../../../src/linter/rules/duplicate-titles";
import { rule as longFiles } from "../../../../src/linter/rules/long-files";
import { rule as folderSize } from "../../../../src/linter/rules/folder-size";
import { rule as adrNumbering } from "../../../../src/linter/rules/adr-numbering";
import { rule as stalePlans } from "../../../../src/linter/rules/stale-plans";
import { rule as adrStatus } from "../../../../src/linter/rules/adr-status";

let tmp: string;
beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-warns-"));
});
afterEach(async () => fs.remove(tmp));

function ctxFor(files: { rel: string; cat: string; base: string }[], cfgCats: string[] = []) {
  return {
    root: tmp,
    config: { version: "1.0", projectType: "library", categories: cfgCats as never, agents: ["claude"], language: "en" } as never,
    files: files.map((f) => ({
      absolutePath: path.join(tmp, "docs", f.rel),
      relativePath: f.rel,
      category: f.cat,
      basename: f.base,
      isReadme: f.base === "README.md",
      isArchived: f.rel.includes("_archive"),
    })),
  };
}

describe("duplicate-titles rule", () => {
  it("warns when two files in different folders share the same H1 title", async () => {
    await fs.outputFile(path.join(tmp, "docs/plans/a.plan.md"), "# Same Title");
    await fs.outputFile(path.join(tmp, "docs/reference/b.pattern.md"), "# Same Title");
    const findings = await duplicateTitles.check(ctxFor([
      { rel: "plans/a.plan.md", cat: "plans", base: "a.plan.md" },
      { rel: "reference/b.pattern.md", cat: "reference", base: "b.pattern.md" },
    ]));
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("warning");
  });
});

describe("long-files rule", () => {
  it("warns when a file exceeds 1000 lines", async () => {
    const long = Array.from({ length: 1001 }, (_, i) => `line ${i}`).join("\n");
    await fs.outputFile(path.join(tmp, "docs/reference/big.pattern.md"), long);
    const findings = await longFiles.check(ctxFor([
      { rel: "reference/big.pattern.md", cat: "reference", base: "big.pattern.md" },
    ]));
    expect(findings.length).toBe(1);
  });
});

describe("folder-size rule", () => {
  it("warns when a folder has >30 files", async () => {
    const files = Array.from({ length: 31 }, (_, i) => ({
      rel: `reference/p${i}.pattern.md`, cat: "reference", base: `p${i}.pattern.md`,
    }));
    const findings = await folderSize.check(ctxFor(files));
    expect(findings.some((f) => f.message.includes("reference"))).toBe(true);
  });
});

describe("adr-numbering rule", () => {
  it("warns on gaps but never errors", async () => {
    const findings = await adrNumbering.check(ctxFor([
      { rel: "adr/ADR-001-a.md", cat: "adr", base: "ADR-001-a.md" },
      { rel: "adr/ADR-003-c.md", cat: "adr", base: "ADR-003-c.md" },
    ]));
    expect(findings.every((f) => f.severity === "warning")).toBe(true);
    expect(findings.some((f) => f.message.includes("002"))).toBe(true);
  });
});

describe("stale-plans rule", () => {
  it("suggests when a plan was not modified in >30 days", async () => {
    await fs.outputFile(path.join(tmp, "docs/plans/old.plan.md"), "# old");
    const past = Date.now() - 1000 * 60 * 60 * 24 * 40;
    await fs.utimes(path.join(tmp, "docs/plans/old.plan.md"), past / 1000, past / 1000);
    const findings = await stalePlans.check(ctxFor([
      { rel: "plans/old.plan.md", cat: "plans", base: "old.plan.md" },
    ]));
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("suggestion");
  });
});

describe("adr-status rule", () => {
  it("suggests when an ADR has no `status:` frontmatter", async () => {
    await fs.outputFile(path.join(tmp, "docs/adr/ADR-001-foo.md"), "# foo\n\nno frontmatter");
    const findings = await adrStatus.check(ctxFor([
      { rel: "adr/ADR-001-foo.md", cat: "adr", base: "ADR-001-foo.md" },
    ]));
    expect(findings.length).toBe(1);
    expect(findings[0]!.severity).toBe("suggestion");
  });
});
