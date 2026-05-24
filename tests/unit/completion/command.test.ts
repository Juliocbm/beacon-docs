import { describe, it, expect } from "vitest";
import { runCompletionCommand } from "../../../src/commands/completion";

describe("commands/completion", () => {
  it("returns the bash script for shell=bash", () => {
    const result = runCompletionCommand({ shell: "bash" });
    expect(result.exitCode).toBe(0);
    expect(result.isError).toBe(false);
    expect(result.output).toContain("complete -F _beacon_completion beacon");
  });

  it("returns the zsh script for shell=zsh", () => {
    const result = runCompletionCommand({ shell: "zsh" });
    expect(result.exitCode).toBe(0);
    expect(result.output.startsWith("#compdef beacon")).toBe(true);
  });

  it("returns the fish script for shell=fish", () => {
    const result = runCompletionCommand({ shell: "fish" });
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("complete -c beacon");
  });

  it("returns an error with a typo suggestion for misspelled shells", () => {
    const result = runCompletionCommand({ shell: "bsh" });
    expect(result.exitCode).toBe(1);
    expect(result.isError).toBe(true);
    expect(result.output).toContain('Did you mean "bash"?');
  });

  it("lists supported shells when no suggestion is close enough", () => {
    const result = runCompletionCommand({ shell: "powershell" });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("Supported shells: bash, zsh, fish");
  });
});
