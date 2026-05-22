import { describe, it, expect } from "vitest";
import {
  PROJECT_TYPES,
  CORE_CATEGORIES,
  ADDON_CATEGORIES,
  defaultCategoriesFor,
  isValidProjectType,
} from "../../../src/core/project-types";

describe("project-types", () => {
  it("declares exactly 7 project types", () => {
    expect(PROJECT_TYPES).toEqual([
      "web-app",
      "backend-service",
      "library",
      "cli-tool",
      "mobile-app",
      "monorepo",
      "custom",
    ]);
  });

  it("lists 6 core categories", () => {
    expect(CORE_CATEGORIES).toEqual([
      "reference",
      "architecture",
      "adr",
      "plans",
      "backlog",
      "evaluations",
    ]);
  });

  it("lists 6 addon categories", () => {
    expect(ADDON_CATEGORIES).toEqual([
      "compliance",
      "business",
      "modules",
      "integrations",
      "operations",
      "roadmaps",
    ]);
  });

  it("library defaults: core only, no addons", () => {
    expect(defaultCategoriesFor("library")).toEqual([
      "reference",
      "architecture",
      "adr",
      "plans",
      "backlog",
      "evaluations",
    ]);
  });

  it("web-app defaults: core + business + integrations + operations + roadmaps", () => {
    expect(defaultCategoriesFor("web-app")).toEqual([
      "reference",
      "architecture",
      "adr",
      "plans",
      "backlog",
      "evaluations",
      "business",
      "integrations",
      "operations",
      "roadmaps",
    ]);
  });

  it("backend-service defaults: core + integrations + operations + roadmaps (no business)", () => {
    expect(defaultCategoriesFor("backend-service")).toEqual([
      "reference",
      "architecture",
      "adr",
      "plans",
      "backlog",
      "evaluations",
      "integrations",
      "operations",
      "roadmaps",
    ]);
  });

  it("cli-tool defaults: core + operations only", () => {
    expect(defaultCategoriesFor("cli-tool")).toEqual([
      "reference",
      "architecture",
      "adr",
      "plans",
      "backlog",
      "evaluations",
      "operations",
    ]);
  });

  it("mobile-app defaults: like web-app", () => {
    expect(defaultCategoriesFor("mobile-app")).toEqual([
      "reference",
      "architecture",
      "adr",
      "plans",
      "backlog",
      "evaluations",
      "business",
      "integrations",
      "operations",
      "roadmaps",
    ]);
  });

  it("monorepo defaults: like web-app + modules, no business", () => {
    expect(defaultCategoriesFor("monorepo")).toEqual([
      "reference",
      "architecture",
      "adr",
      "plans",
      "backlog",
      "evaluations",
      "modules",
      "integrations",
      "operations",
      "roadmaps",
    ]);
  });

  it("custom defaults: empty (only _meta is implicit)", () => {
    expect(defaultCategoriesFor("custom")).toEqual([]);
  });

  it("validates known project types", () => {
    expect(isValidProjectType("web-app")).toBe(true);
    expect(isValidProjectType("unknown")).toBe(false);
  });
});
