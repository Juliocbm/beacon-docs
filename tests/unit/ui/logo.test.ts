import { describe, it, expect } from "vitest";
import { renderLogo, TAGLINE } from "../../../src/ui/logo";
import { stripAnsi } from "../../test-utils";

describe("ui/logo", () => {
  it("TAGLINE is the expected string", () => {
    expect(TAGLINE).toBe("Trail markers for AI-collaborative codebases.");
  });

  it("renderLogo includes the 4 lighthouse lines (stripped)", () => {
    const out = stripAnsi(renderLogo("0.1.2"));
    expect(out).toContain("╱╲");
    expect(out).toContain("╱  ╲");
    expect(out).toContain("╱────╲");
    expect(out).toContain("╱──────╲");
  });

  it("renderLogo includes the version", () => {
    const out = stripAnsi(renderLogo("0.1.2"));
    expect(out).toContain("v0.1.2");
  });

  it("renderLogo includes the brand name", () => {
    const out = stripAnsi(renderLogo("9.9.9"));
    expect(out).toContain("beacon");
  });

  it("renderLogo includes the homepage URL", () => {
    const out = stripAnsi(renderLogo("0.1.2"));
    expect(out).toContain("beacon-docs.com");
  });
});
