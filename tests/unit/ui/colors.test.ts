import { describe, it, expect } from "vitest";
import { c } from "../../../src/ui/colors";
import { stripAnsi } from "../../test-utils";

describe("ui/colors", () => {
  it("exports c with all expected color functions", () => {
    expect(typeof c.red).toBe("function");
    expect(typeof c.green).toBe("function");
    expect(typeof c.yellow).toBe("function");
    expect(typeof c.cyan).toBe("function");
    expect(typeof c.dim).toBe("function");
    expect(typeof c.bold).toBe("function");
  });

  it("each color function returns a string containing the input text after ANSI strip", () => {
    expect(stripAnsi(c.red("hello"))).toBe("hello");
    expect(stripAnsi(c.green("ok"))).toBe("ok");
    expect(stripAnsi(c.yellow("warn"))).toBe("warn");
    expect(stripAnsi(c.cyan("info"))).toBe("info");
    expect(stripAnsi(c.dim("muted"))).toBe("muted");
    expect(stripAnsi(c.bold("strong"))).toBe("strong");
  });

  it("supports composition (bold + cyan)", () => {
    expect(stripAnsi(c.bold(c.cyan("title")))).toBe("title");
  });
});
