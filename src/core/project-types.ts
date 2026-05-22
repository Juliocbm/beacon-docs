export const PROJECT_TYPES = [
  "web-app",
  "backend-service",
  "library",
  "cli-tool",
  "mobile-app",
  "monorepo",
  "custom",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const CORE_CATEGORIES = [
  "reference",
  "architecture",
  "adr",
  "plans",
  "backlog",
  "evaluations",
] as const;

export const ADDON_CATEGORIES = [
  "compliance",
  "business",
  "modules",
  "integrations",
  "operations",
  "roadmaps",
] as const;

export type CoreCategory = (typeof CORE_CATEGORIES)[number];
export type AddonCategory = (typeof ADDON_CATEGORIES)[number];
export type Category = CoreCategory | AddonCategory;

const DEFAULTS_BY_TYPE: Record<ProjectType, readonly Category[]> = {
  "web-app": [
    ...CORE_CATEGORIES,
    "business",
    "integrations",
    "operations",
    "roadmaps",
  ],
  "backend-service": [
    ...CORE_CATEGORIES,
    "integrations",
    "operations",
    "roadmaps",
  ],
  library: [...CORE_CATEGORIES],
  "cli-tool": [...CORE_CATEGORIES, "operations"],
  "mobile-app": [
    ...CORE_CATEGORIES,
    "business",
    "integrations",
    "operations",
    "roadmaps",
  ],
  monorepo: [
    ...CORE_CATEGORIES,
    "modules",
    "integrations",
    "operations",
    "roadmaps",
  ],
  custom: [],
};

export function defaultCategoriesFor(type: ProjectType): Category[] {
  return [...DEFAULTS_BY_TYPE[type]];
}

export function isValidProjectType(value: string): value is ProjectType {
  return (PROJECT_TYPES as readonly string[]).includes(value);
}
