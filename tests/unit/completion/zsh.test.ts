import { describe, it, expect } from "vitest";
import { renderZshCompletion } from "../../../src/completion/zsh";

describe("completion/zsh", () => {
  const script = renderZshCompletion();

  it("starts with the #compdef directive", () => {
    expect(script.startsWith("#compdef beacon")).toBe(true);
  });

  it("defines the _beacon function", () => {
    expect(script).toContain("_beacon() {");
    expect(script).toContain('_beacon "$@"');
  });

  it("describes each top-level command via _values entries", () => {
    expect(script).toContain("'init:Initialize Beacon docs convention");
    expect(script).toContain("'doctor:Surface docs-tree health signals'");
    expect(script).toContain("'completion:Print a shell completion script");
  });

  it("backslash-continues every _values entry except the last", () => {
    // Find the top-level _values block by locating the header...
    const headerIdx = script.indexOf('_values "beacon command"');
    expect(headerIdx).toBeGreaterThan(-1);
    // ... then walk lines until we hit the `return 0` that ends it.
    const block = script.slice(headerIdx, script.indexOf("return 0", headerIdx));
    const lines = block.split("\n").filter((l) => l.trim().startsWith("'"));
    // All entry lines except the final one must end with " \"
    expect(lines.length).toBeGreaterThan(2);
    for (let i = 0; i < lines.length - 1; i++) {
      expect(lines[i]!.endsWith(" \\"), `entry ${i} should end with backslash`).toBe(true);
    }
    expect(lines[lines.length - 1]!.endsWith(" \\")).toBe(false);
  });

  it("includes positional value branches", () => {
    expect(script).toContain('_values "enable"');
    expect(script).toContain('_values "completion"');
  });

  it("includes dynamic-slug completion via filesystem glob", () => {
    expect(script).toContain("ls docs/plans/*.plan.md");
    expect(script).toContain("ls docs/roadmaps/*.roadmap.md");
  });

  it("offers flag-value sets like --type and --explain", () => {
    expect(script).toContain('"${words[CURRENT-1]}" == "--type"');
    expect(script).toContain('"${words[CURRENT-1]}" == "--explain"');
  });
});
