import fs from "fs-extra";

export type ExistingFileAction = "replace" | "merge" | "skip";

const START = "<!-- BEACON:START -->";
const END = "<!-- BEACON:END -->";

export async function handleExistingFile(
  filePath: string,
  newContent: string,
  action: ExistingFileAction,
): Promise<void> {
  const exists = await fs.pathExists(filePath);

  if (!exists || action === "replace") {
    await fs.writeFile(filePath, newContent, "utf8");
    return;
  }

  if (action === "skip") {
    return;
  }

  // merge — preserve newContent exactly; do not trim (matches replace/new-file behavior for symmetry)
  const existing = await fs.readFile(filePath, "utf8");
  const block = `${START}\n${newContent}\n${END}`;
  if (existing.includes(START) && existing.includes(END)) {
    const re = new RegExp(`${START}[\\s\\S]*?${END}`);
    const merged = existing.replace(re, block);
    await fs.writeFile(filePath, merged, "utf8");
  } else {
    const sep = existing.endsWith("\n") ? "" : "\n";
    await fs.writeFile(filePath, `${existing}${sep}\n${block}\n`, "utf8");
  }
}
