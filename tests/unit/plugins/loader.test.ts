import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import {
  loadPlugins,
  resolvePluginPath,
  assertValidPlugin,
} from "../../../src/plugins/loader";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "beacon-plugins-"));
});

afterEach(async () => fs.remove(tmp));

async function writePluginModule(relPath: string, content: string): Promise<string> {
  const full = path.join(tmp, relPath);
  await fs.ensureDir(path.dirname(full));
  await fs.writeFile(full, content, "utf8");
  return full;
}

describe("plugins/resolvePluginPath", () => {
  it("resolves relative paths starting with ./", () => {
    const p = resolvePluginPath("./plugins/foo.mjs", "/proj");
    expect(p).toBe(path.resolve("/proj/plugins/foo.mjs"));
  });

  it("resolves relative paths starting with ../", () => {
    const p = resolvePluginPath("../shared/plugin.mjs", "/proj/sub");
    expect(p).toBe(path.resolve("/proj/sub/../shared/plugin.mjs"));
  });

  it("resolves absolute paths verbatim", () => {
    const abs = path.resolve("/tmp/abs.mjs");
    expect(resolvePluginPath(abs, "/proj")).toBe(abs);
  });

  it("throws a friendly error for missing npm packages", () => {
    expect(() => resolvePluginPath("this-package-does-not-exist-xyz", tmp)).toThrow(
      /Cannot find plugin "this-package-does-not-exist-xyz"/,
    );
  });

  it("throws on empty source", () => {
    expect(() => resolvePluginPath("", "/proj")).toThrow(/Plugin source is empty/);
  });
});

describe("plugins/assertValidPlugin", () => {
  it("accepts a minimal valid plugin", () => {
    expect(() => assertValidPlugin({ name: "foo" }, "src")).not.toThrow();
  });

  it("rejects non-objects", () => {
    expect(() => assertValidPlugin(null, "src")).toThrow(/did not export a plugin object/);
    expect(() => assertValidPlugin("oops", "src")).toThrow(/did not export a plugin object/);
  });

  it("requires a non-empty name", () => {
    expect(() => assertValidPlugin({}, "src")).toThrow(/missing the required `name` field/);
    expect(() => assertValidPlugin({ name: "" }, "src")).toThrow(/missing the required `name`/);
  });

  it("rejects checks/rules of the wrong type", () => {
    expect(() => assertValidPlugin({ name: "foo", checks: {} }, "src")).toThrow(
      /`checks` field that is not an array/,
    );
    expect(() => assertValidPlugin({ name: "foo", rules: "nope" }, "src")).toThrow(
      /`rules` field that is not an array/,
    );
  });
});

describe("plugins/loadPlugins (integration)", () => {
  it("loads a relative-path plugin with a default export", async () => {
    await writePluginModule(
      "plugins/myplugin.mjs",
      `export default { name: "my-plugin", version: "1.0.0", checks: [], rules: [] };`,
    );
    const result = await loadPlugins({
      root: tmp,
      sources: ["./plugins/myplugin.mjs"],
    });
    expect(result.errors).toEqual([]);
    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]?.plugin.name).toBe("my-plugin");
    expect(result.plugins[0]?.source).toBe("./plugins/myplugin.mjs");
  });

  it("loads a relative-path plugin with a named `plugin` export", async () => {
    await writePluginModule(
      "plugins/named.mjs",
      `export const plugin = { name: "named-plugin" };`,
    );
    const result = await loadPlugins({
      root: tmp,
      sources: ["./plugins/named.mjs"],
    });
    expect(result.errors).toEqual([]);
    expect(result.plugins[0]?.plugin.name).toBe("named-plugin");
  });

  it("loads multiple plugins in the order they appear in config", async () => {
    await writePluginModule(
      "plugins/a.mjs",
      `export default { name: "a-plugin" };`,
    );
    await writePluginModule(
      "plugins/b.mjs",
      `export default { name: "b-plugin" };`,
    );
    const result = await loadPlugins({
      root: tmp,
      sources: ["./plugins/a.mjs", "./plugins/b.mjs"],
    });
    expect(result.plugins.map((p) => p.plugin.name)).toEqual(["a-plugin", "b-plugin"]);
  });

  it("accumulates errors instead of throwing when a plugin fails to load", async () => {
    await writePluginModule(
      "plugins/good.mjs",
      `export default { name: "good" };`,
    );
    // Note: missing-plugin.mjs is intentionally not created.
    const result = await loadPlugins({
      root: tmp,
      sources: ["./plugins/good.mjs", "./plugins/missing-plugin.mjs"],
    });
    expect(result.plugins).toHaveLength(1);
    expect(result.plugins[0]?.plugin.name).toBe("good");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.source).toBe("./plugins/missing-plugin.mjs");
  });

  it("rejects plugins that don't satisfy the contract", async () => {
    await writePluginModule(
      "plugins/bad.mjs",
      `export default { /* no name */ checks: [] };`,
    );
    const result = await loadPlugins({
      root: tmp,
      sources: ["./plugins/bad.mjs"],
    });
    expect(result.plugins).toEqual([]);
    expect(result.errors[0]?.message).toMatch(/missing the required `name`/);
  });
});
