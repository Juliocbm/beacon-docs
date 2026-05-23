import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { addDocsLintScript } from "../../../src/core/package-json";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-pkg-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("addDocsLintScript", () => {
  it("does nothing if package.json does not exist", async () => {
    await addDocsLintScript(tmp);
    expect(await fs.pathExists(path.join(tmp, "package.json"))).toBe(false);
  });

  it("adds docs:lint script when scripts block exists", async () => {
    await fs.writeJson(path.join(tmp, "package.json"), {
      name: "x",
      scripts: { test: "vitest" },
    });
    await addDocsLintScript(tmp);
    const pkg = await fs.readJson(path.join(tmp, "package.json"));
    expect(pkg.scripts["docs:lint"]).toBe("beacon lint");
    expect(pkg.scripts.test).toBe("vitest");
  });

  it("creates scripts block if missing", async () => {
    await fs.writeJson(path.join(tmp, "package.json"), { name: "x" });
    await addDocsLintScript(tmp);
    const pkg = await fs.readJson(path.join(tmp, "package.json"));
    expect(pkg.scripts["docs:lint"]).toBe("beacon lint");
  });

  it("does not overwrite an existing docs:lint script", async () => {
    await fs.writeJson(path.join(tmp, "package.json"), {
      name: "x",
      scripts: { "docs:lint": "custom-command" },
    });
    await addDocsLintScript(tmp);
    const pkg = await fs.readJson(path.join(tmp, "package.json"));
    expect(pkg.scripts["docs:lint"]).toBe("custom-command");
  });
});
