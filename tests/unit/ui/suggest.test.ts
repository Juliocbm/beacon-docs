import { describe, it, expect } from "vitest";
import { levenshtein, closestMatch } from "../../../src/ui/suggest";

describe("ui/suggest.levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("returns the length when one string is empty", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("returns 1 for a single substitution", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });

  it("returns 1 for a single insertion or deletion", () => {
    expect(levenshtein("cat", "cats")).toBe(1);
    expect(levenshtein("cats", "cat")).toBe(1);
  });

  it("returns 2 for transposition (insertion + deletion)", () => {
    expect(levenshtein("ab", "ba")).toBe(2);
  });

  it("handles realistic typos", () => {
    expect(levenshtein("nwe", "new")).toBe(2);
    expect(levenshtein("opperatioins", "operations")).toBeGreaterThan(0);
    expect(levenshtein("opperatioins", "operations")).toBeLessThan(5);
  });
});

describe("ui/suggest.closestMatch", () => {
  const commands = ["init", "new", "archive", "sync", "enable", "disable", "lint"];
  const addons = ["compliance", "business", "modules", "integrations", "operations", "roadmaps"];

  it("returns exact match", () => {
    expect(closestMatch("new", commands)).toBe("new");
  });

  it("suggests `new` for `nwe` typo", () => {
    expect(closestMatch("nwe", commands)).toBe("new");
  });

  it("suggests `operations` for `opperatioins` typo", () => {
    expect(closestMatch("opperatioins", addons)).toBe("operations");
  });

  it("suggests `lint` for `linnt` typo", () => {
    expect(closestMatch("linnt", commands)).toBe("lint");
  });

  it("returns null when nothing is within distance threshold", () => {
    expect(closestMatch("zzzzzzz", commands)).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(closestMatch("NEW", commands)).toBe("new");
    expect(closestMatch("Operations", addons)).toBe("operations");
  });

  it("returns null for empty input", () => {
    expect(closestMatch("", commands, 0)).toBeNull();
  });
});
