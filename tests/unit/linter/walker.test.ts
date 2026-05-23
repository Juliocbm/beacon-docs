import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { walkDocs } from "../../../src/linter/walker";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-walker-"));
  await fs.ensureDir(path.join(tmp, "docs", "plans"));
  await fs.writeFile(path.join(tmp, "docs", "plans", "a.plan.md"), "# a");
  await fs.writeFile(path.join(tmp, "docs", "plans", "README.md"), "# plans");
  await fs.ensureDir(path.join(tmp, "docs", "plans", "_archive"));
  await fs.writeFile(path.join(tmp, "docs", "plans", "_archive", "old.plan.md"), "# old");
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("walkDocs", () => {
  it("returns all .md files under docs/", async () => {
    const files = await walkDocs(tmp);
    expect(files.map((f) => f.relativePath).sort()).toEqual(
      ["plans/README.md", "plans/_archive/old.plan.md", "plans/a.plan.md"].sort(),
    );
  });

  it("each file has category, basename, isArchived, isReadme", async () => {
    const files = await walkDocs(tmp);
    const a = files.find((f) => f.relativePath === "plans/a.plan.md")!;
    expect(a.category).toBe("plans");
    expect(a.isArchived).toBe(false);
    expect(a.isReadme).toBe(false);

    const old = files.find((f) => f.relativePath === "plans/_archive/old.plan.md")!;
    expect(old.isArchived).toBe(true);

    const readme = files.find((f) => f.relativePath === "plans/README.md")!;
    expect(readme.isReadme).toBe(true);
  });
});
