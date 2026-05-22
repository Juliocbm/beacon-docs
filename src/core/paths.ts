import path from "node:path";
import type { Category } from "./project-types";

export function docsDir(root: string): string {
  return path.join(root, "docs");
}

export function metaDir(root: string): string {
  return path.join(docsDir(root), "_meta");
}

export function conventionPath(root: string): string {
  return path.join(metaDir(root), "convention.md");
}

export function categoryDir(root: string, category: Category | string): string {
  return path.join(docsDir(root), category);
}

export function archiveDir(root: string, category: Category | string): string {
  return path.join(categoryDir(root, category), "_archive");
}

export function rootFile(root: string, name: string): string {
  return path.join(root, name);
}
