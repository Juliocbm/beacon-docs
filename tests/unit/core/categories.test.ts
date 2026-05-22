import { describe, it, expect } from "vitest";
import {
  CATEGORY_META,
  metaFor,
  suffixFor,
  locationFor,
  isArchivable,
  requiresDatePrefix,
} from "../../../src/core/categories";

describe("categories metadata", () => {
  it("plans: suffix .plan.md, archivable", () => {
    const meta = metaFor("plans");
    expect(meta.suffix).toBe(".plan.md");
    expect(meta.location).toBe("plans");
    expect(meta.archivable).toBe(true);
    expect(meta.datePrefix).toBe(false);
  });

  it("evaluations: suffix .eval.md, date-prefixed, NOT archivable", () => {
    const meta = metaFor("evaluations");
    expect(meta.suffix).toBe(".eval.md");
    expect(meta.location).toBe("evaluations");
    expect(meta.archivable).toBe(false);
    expect(meta.datePrefix).toBe(true);
  });

  it("adr: special pattern (ADR-NNN-*.md), NOT archivable", () => {
    const meta = metaFor("adr");
    expect(meta.suffix).toBe(".md");
    expect(meta.location).toBe("adr");
    expect(meta.archivable).toBe(false);
    expect(meta.numberedPrefix).toBe("ADR-");
  });

  it("compliance: no suffix beyond .md", () => {
    const meta = metaFor("compliance");
    expect(meta.suffix).toBe(".md");
    expect(meta.location).toBe("compliance");
  });

  it("business: suffix .business.md", () => {
    expect(suffixFor("business")).toBe(".business.md");
  });

  it("backlog: suffix .todo.md (filename has different stem than folder)", () => {
    expect(suffixFor("backlog")).toBe(".todo.md");
  });

  it("roadmaps: archivable", () => {
    expect(isArchivable("roadmaps")).toBe(true);
  });

  it("plans: archivable", () => {
    expect(isArchivable("plans")).toBe(true);
  });

  it("integrations: not archivable", () => {
    expect(isArchivable("integrations")).toBe(false);
  });

  it("evaluations require date prefix", () => {
    expect(requiresDatePrefix("evaluations")).toBe(true);
  });

  it("plans do not require date prefix", () => {
    expect(requiresDatePrefix("plans")).toBe(false);
  });

  it("locationFor returns the folder name", () => {
    expect(locationFor("reference")).toBe("reference");
    expect(locationFor("backlog")).toBe("backlog");
  });
});
