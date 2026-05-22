import { describe, it, expect } from "vitest";
import path from "node:path";
import {
  docsDir,
  metaDir,
  conventionPath,
  categoryDir,
  archiveDir,
  rootFile,
} from "../../../src/core/paths";

describe("paths", () => {
  it("docsDir resolves to {root}/docs", () => {
    expect(docsDir("/r")).toBe(path.join("/r", "docs"));
  });

  it("metaDir resolves to {root}/docs/_meta", () => {
    expect(metaDir("/r")).toBe(path.join("/r", "docs", "_meta"));
  });

  it("conventionPath resolves to {root}/docs/_meta/convention.md", () => {
    expect(conventionPath("/r")).toBe(
      path.join("/r", "docs", "_meta", "convention.md"),
    );
  });

  it("categoryDir resolves to {root}/docs/{category}", () => {
    expect(categoryDir("/r", "plans")).toBe(
      path.join("/r", "docs", "plans"),
    );
  });

  it("archiveDir resolves to {root}/docs/{category}/_archive", () => {
    expect(archiveDir("/r", "plans")).toBe(
      path.join("/r", "docs", "plans", "_archive"),
    );
  });

  it("rootFile joins root and filename", () => {
    expect(rootFile("/r", "CLAUDE.md")).toBe(path.join("/r", "CLAUDE.md"));
  });
});
