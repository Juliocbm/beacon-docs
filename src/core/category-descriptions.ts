import type { Category } from "./project-types";

export interface CategoryDescription {
  title: string;
  long: string;
  short: string;
}

export const CATEGORY_DESCRIPTIONS: Record<Category, CategoryDescription> = {
  reference: {
    title: "reference/",
    long: "Replicable technical patterns — *how* something is done.",
    short: "Replicable technical patterns.",
  },
  architecture: {
    title: "architecture/",
    long: "System structure and layering decisions.",
    short: "System structure and layering decisions.",
  },
  adr: {
    title: "adr/",
    long: "Architecture Decision Records — *why* a choice was made.",
    short: "Architecture Decision Records.",
  },
  plans: {
    title: "plans/",
    long: "Active work with checked TODOs.",
    short: "Active work with TODOs.",
  },
  backlog: {
    title: "backlog/",
    long: "Future work items not yet planned.",
    short: "Future items waiting to be sprinted.",
  },
  evaluations: {
    title: "evaluations/",
    long: "Date-prefixed audits and state snapshots.",
    short: "Date-prefixed audits and snapshots.",
  },
  compliance: {
    title: "compliance/",
    long: "Regulatory and normative documents.",
    short: "Regulatory and normative docs.",
  },
  business: {
    title: "business/",
    long: "Business model, pricing, product strategy.",
    short: "Business model and product strategy.",
  },
  modules: {
    title: "modules/",
    long: "Domain modules and their functional behavior.",
    short: "Domain modules and their behavior.",
  },
  integrations: {
    title: "integrations/",
    long: "External service setup and configuration.",
    short: "External service setup.",
  },
  operations: {
    title: "operations/",
    long: "Runbooks, deploy guides, troubleshooting.",
    short: "Runbooks and deploy guides.",
  },
  roadmaps: {
    title: "roadmaps/",
    long: "Multi-sprint planning (longer than `plans/`).",
    short: "Multi-sprint planning.",
  },
};
