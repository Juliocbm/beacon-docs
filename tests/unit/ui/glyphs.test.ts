import { describe, it, expect } from "vitest";
import { CHECK, CROSS, WARN, ARROW, TREE_LAST } from "../../../src/ui/glyphs";
import { stripAnsi } from "../../test-utils";

describe("ui/glyphs", () => {
  it("CHECK includes ✔ character", () => {
    expect(stripAnsi(CHECK)).toBe("✔");
  });

  it("CROSS includes ✗ character", () => {
    expect(stripAnsi(CROSS)).toBe("✗");
  });

  it("WARN includes ⚠ character", () => {
    expect(stripAnsi(WARN)).toBe("⚠");
  });

  it("ARROW includes → character", () => {
    expect(stripAnsi(ARROW)).toBe("→");
  });

  it("TREE_LAST includes └─ characters", () => {
    expect(stripAnsi(TREE_LAST)).toBe("└─");
  });
});
