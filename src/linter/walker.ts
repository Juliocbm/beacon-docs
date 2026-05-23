import fg from "fast-glob";
import path from "node:path";
import { docsDir } from "../core/paths";
import type { DocFile } from "./types";

export async function walkDocs(root: string): Promise<DocFile[]> {
  const base = docsDir(root);
  const matches = await fg(["**/*.md"], {
    cwd: base,
    dot: false,
    onlyFiles: true,
  });
  return matches.map((rel) => {
    const segments = rel.split("/");
    const category = segments[0] === "_meta" ? "_meta" : segments[0]!;
    return {
      absolutePath: path.join(base, rel),
      relativePath: rel,    // relative to docs/, matches test expectation
      category,
      basename: path.basename(rel),
      isReadme: path.basename(rel) === "README.md",
      isArchived: segments.includes("_archive"),
    };
  });
}
