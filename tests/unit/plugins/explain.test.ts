import { describe, it, expect, beforeEach } from "vitest";
import { renderPluginExplain, getPluginNames } from "../../../src/plugins/explain";
import type { LoadedPlugin } from "../../../src/plugins/types";

beforeEach(() => {
  process.env.NO_COLOR = "1";
});

const ANSI = /\x1b\[[0-9;]*m/g;
const strip = (s: string) => s.replace(ANSI, "");

const samplePlugins: LoadedPlugin[] = [
  {
    source: "./plugins/foo.mjs",
    resolvedPath: "/abs/plugins/foo.mjs",
    plugin: {
      name: "foo-plugin",
      checks: [
        {
          name: "weird-titles",
          area: "activity",
          check: () => [],
        },
      ],
      rules: [
        {
          name: "no-foo-anywhere",
          severity: "warning",
          check: () => [],
        },
      ],
      explain: {
        "weird-titles": {
          summary: "Flags docs whose H1 contains weird characters.",
          why: "Because consistency matters.",
          fix: "Rename the title to be normal.",
        },
      },
    },
  },
];

describe("plugins/renderPluginExplain", () => {
  it("returns null when the name is not found in any plugin", () => {
    expect(renderPluginExplain("unknown", "check", samplePlugins)).toBeNull();
    expect(renderPluginExplain("unknown", "rule", samplePlugins)).toBeNull();
  });

  it("renders an explainer using the plugin's explain entry when present", () => {
    const text = renderPluginExplain("weird-titles", "check", samplePlugins);
    expect(text).not.toBeNull();
    const clean = strip(text!);
    expect(clean).toContain("Check: weird-titles");
    expect(clean).toContain("plugin: foo-plugin");
    expect(clean).toContain("Flags docs whose H1");
    expect(clean).toContain("Why this exists:");
    expect(clean).toContain("Because consistency matters.");
    expect(clean).toContain("How to fix:");
  });

  it("renders a fallback when the plugin provides no explain entry", () => {
    const text = renderPluginExplain("no-foo-anywhere", "rule", samplePlugins);
    expect(text).not.toBeNull();
    const clean = strip(text!);
    expect(clean).toContain("Rule: no-foo-anywhere");
    expect(clean).toContain("plugin: foo-plugin");
    expect(clean).toContain("No explainer text provided by the plugin");
  });

  it("looks up by kind (rule vs check)", () => {
    // weird-titles is a check; asking for it as a rule should miss.
    expect(renderPluginExplain("weird-titles", "rule", samplePlugins)).toBeNull();
    expect(renderPluginExplain("no-foo-anywhere", "check", samplePlugins)).toBeNull();
  });
});

describe("plugins/getPluginNames", () => {
  it("flattens names of checks across plugins", () => {
    expect(getPluginNames(samplePlugins, "check")).toEqual(["weird-titles"]);
  });

  it("flattens names of rules across plugins", () => {
    expect(getPluginNames(samplePlugins, "rule")).toEqual(["no-foo-anywhere"]);
  });

  it("returns empty array when plugins list is empty", () => {
    expect(getPluginNames([], "check")).toEqual([]);
  });
});
