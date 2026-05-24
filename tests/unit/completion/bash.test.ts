import { describe, it, expect } from "vitest";
import { renderBashCompletion } from "../../../src/completion/bash";

describe("completion/bash", () => {
  const script = renderBashCompletion();

  it("registers the completion function on the `beacon` command", () => {
    expect(script).toContain("complete -F _beacon_completion beacon");
  });

  it("lists all 9 top-level commands", () => {
    expect(script).toContain('init sync new archive enable disable lint doctor completion');
  });

  it("offers add-on names for enable and disable", () => {
    expect(script).toMatch(/enable\)[\s\S]*?compliance business modules integrations operations roadmaps/);
    expect(script).toMatch(/disable\)[\s\S]*?compliance business modules integrations operations roadmaps/);
  });

  it("offers doc types for `beacon new <type>`", () => {
    expect(script).toMatch(/new\)[\s\S]*?plan adr pattern eval architecture module guide roadmap todo business compliance/);
  });

  it("offers project types for `--type` flag value", () => {
    expect(script).toMatch(/--type\)[\s\S]*?web-app backend-service library cli-tool mobile-app monorepo custom/);
  });

  it("offers lint rule names for `lint --explain`", () => {
    expect(script).toMatch(/lint\)[\s\S]*?suffix-location kebab-case eval-date-prefix/);
  });

  it("offers doctor check names for `doctor --explain`", () => {
    expect(script).toMatch(/doctor\)[\s\S]*?stale-plans/);
    expect(script).toMatch(/doctor\)[\s\S]*?proposed-adrs/);
    expect(script).toMatch(/doctor\)[\s\S]*?orphan-readmes/);
    expect(script).toMatch(/doctor\)[\s\S]*?backlog-balance/);
  });

  it("dynamically completes plan slugs for `archive plan <slug>`", () => {
    expect(script).toContain("ls docs/plans/*.plan.md");
    expect(script).toContain("docs/roadmaps/*.roadmap.md");
  });

  it("offers supported shells for `completion <shell>`", () => {
    expect(script).toMatch(/completion\)[\s\S]*?bash zsh fish/);
  });

  it("emits an install hint comment", () => {
    expect(script).toContain("bash-completion/completions/beacon");
  });
});
