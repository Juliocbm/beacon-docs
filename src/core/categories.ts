import type { Category } from "./project-types";

export interface CategoryMeta {
  category: Category;
  location: string;
  suffix: string;
  archivable: boolean;
  datePrefix: boolean;
  numberedPrefix?: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  reference: {
    category: "reference",
    location: "reference",
    suffix: ".pattern.md",
    archivable: false,
    datePrefix: false,
  },
  architecture: {
    category: "architecture",
    location: "architecture",
    suffix: ".architecture.md",
    archivable: false,
    datePrefix: false,
  },
  adr: {
    category: "adr",
    location: "adr",
    suffix: ".md",
    archivable: false,
    datePrefix: false,
    numberedPrefix: "ADR-",
  },
  plans: {
    category: "plans",
    location: "plans",
    suffix: ".plan.md",
    archivable: true,
    datePrefix: false,
  },
  backlog: {
    category: "backlog",
    location: "backlog",
    suffix: ".todo.md",
    archivable: false,
    datePrefix: false,
  },
  evaluations: {
    category: "evaluations",
    location: "evaluations",
    suffix: ".eval.md",
    archivable: false,
    datePrefix: true,
  },
  compliance: {
    category: "compliance",
    location: "compliance",
    suffix: ".md",
    archivable: false,
    datePrefix: false,
  },
  business: {
    category: "business",
    location: "business",
    suffix: ".business.md",
    archivable: false,
    datePrefix: false,
  },
  modules: {
    category: "modules",
    location: "modules",
    suffix: ".module.md",
    archivable: false,
    datePrefix: false,
  },
  integrations: {
    category: "integrations",
    location: "integrations",
    suffix: ".guide.md",
    archivable: false,
    datePrefix: false,
  },
  operations: {
    category: "operations",
    location: "operations",
    suffix: ".guide.md",
    archivable: false,
    datePrefix: false,
  },
  roadmaps: {
    category: "roadmaps",
    location: "roadmaps",
    suffix: ".roadmap.md",
    archivable: true,
    datePrefix: false,
  },
};

export function metaFor(category: Category): CategoryMeta {
  return CATEGORY_META[category];
}

export function suffixFor(category: Category): string {
  return CATEGORY_META[category].suffix;
}

export function locationFor(category: Category): string {
  return CATEGORY_META[category].location;
}

export function isArchivable(category: Category): boolean {
  return CATEGORY_META[category].archivable;
}

export function requiresDatePrefix(category: Category): boolean {
  return CATEGORY_META[category].datePrefix;
}
