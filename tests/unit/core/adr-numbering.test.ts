import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { nextAdrNumber } from "../../../src/core/adr-numbering";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-adr-"));
  await fs.ensureDir(path.join(tmp, "docs", "adr"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("nextAdrNumber", () => {
  it("returns 001 when no ADRs exist", async () => {
    expect(await nextAdrNumber(tmp)).toBe("001");
  });

  it("returns the next number after existing ADRs", async () => {
    await fs.writeFile(path.join(tmp, "docs", "adr", "ADR-001-foo.md"), "");
    await fs.writeFile(path.join(tmp, "docs", "adr", "ADR-002-bar.md"), "");
    expect(await nextAdrNumber(tmp)).toBe("003");
  });

  it("handles gaps (next after highest, not lowest unused)", async () => {
    await fs.writeFile(path.join(tmp, "docs", "adr", "ADR-001-foo.md"), "");
    await fs.writeFile(path.join(tmp, "docs", "adr", "ADR-005-bar.md"), "");
    expect(await nextAdrNumber(tmp)).toBe("006");
  });

  it("ignores non-ADR files in the folder", async () => {
    await fs.writeFile(path.join(tmp, "docs", "adr", "README.md"), "");
    expect(await nextAdrNumber(tmp)).toBe("001");
  });
});
