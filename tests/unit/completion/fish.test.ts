import { describe, it, expect } from "vitest";
import { renderFishCompletion } from "../../../src/completion/fish";

describe("completion/fish", () => {
  const script = renderFishCompletion();

  it("uses fish's complete builtin", () => {
    expect(script).toContain("complete -c beacon");
  });

  it("registers every top-level command with __fish_use_subcommand", () => {
    expect(script).toContain('complete -c beacon -n "__fish_use_subcommand" -a "init"');
    expect(script).toContain('complete -c beacon -n "__fish_use_subcommand" -a "doctor"');
    expect(script).toContain('complete -c beacon -n "__fish_use_subcommand" -a "completion"');
  });

  it("includes command descriptions", () => {
    expect(script).toContain("-d 'Surface docs-tree health signals'");
    expect(script).toContain("-d 'Initialize Beacon docs convention in this project'");
  });

  it("conditions enable/disable positional values on the subcommand", () => {
    expect(script).toContain('-n "__fish_seen_subcommand_from enable');
    expect(script).toContain('-n "__fish_seen_subcommand_from disable');
    expect(script).toContain('-a "compliance"');
  });

  it("conditions archive dynamic slugs on the first positional value", () => {
    expect(script).toContain('__fish_seen_subcommand_from plan');
    expect(script).toContain("ls docs/plans/*.plan.md");
  });

  it("declares value-taking flags with -x -a values", () => {
    expect(script).toMatch(/-l type -x -a "web-app backend-service library/);
    expect(script).toMatch(/-l explain -x -a "suffix-location/);
  });

  it("declares boolean flags without -x", () => {
    expect(script).toMatch(/-l strict\b(?!.*-a)/);
    expect(script).toMatch(/-l json\b(?!.*-a)/);
  });
});
