import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { handleExistingFile, type ExistingFileAction } from "../../../src/core/existing-files";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-existing-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("handleExistingFile", () => {
  it("writes the new content when the file does not exist", async () => {
    const p = path.join(tmp, "CLAUDE.md");
    await handleExistingFile(p, "new content", "replace");
    expect(await fs.readFile(p, "utf8")).toBe("new content");
  });

  it("'replace' overwrites existing content", async () => {
    const p = path.join(tmp, "CLAUDE.md");
    await fs.writeFile(p, "old content");
    await handleExistingFile(p, "new content", "replace");
    expect(await fs.readFile(p, "utf8")).toBe("new content");
  });

  it("'skip' leaves existing content untouched", async () => {
    const p = path.join(tmp, "CLAUDE.md");
    await fs.writeFile(p, "old content");
    await handleExistingFile(p, "new content", "skip");
    expect(await fs.readFile(p, "utf8")).toBe("old content");
  });

  it("'merge' appends a Beacon-managed block when none exists", async () => {
    const p = path.join(tmp, "CLAUDE.md");
    await fs.writeFile(p, "user notes\n");
    await handleExistingFile(p, "new content", "merge");
    const after = await fs.readFile(p, "utf8");
    expect(after).toContain("user notes");
    expect(after).toContain("<!-- BEACON:START -->");
    expect(after).toContain("new content");
    expect(after).toContain("<!-- BEACON:END -->");
  });

  it("'merge' replaces the Beacon-managed block on subsequent runs", async () => {
    const p = path.join(tmp, "CLAUDE.md");
    const seeded = `user notes\n<!-- BEACON:START -->\nold beacon\n<!-- BEACON:END -->\nmore notes\n`;
    await fs.writeFile(p, seeded);
    await handleExistingFile(p, "new beacon", "merge");
    const after = await fs.readFile(p, "utf8");
    expect(after).toContain("user notes");
    expect(after).toContain("more notes");
    expect(after).toContain("new beacon");
    expect(after).not.toContain("old beacon");
  });
});
