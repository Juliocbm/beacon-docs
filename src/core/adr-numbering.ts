import fs from "fs-extra";
import { categoryDir } from "./paths";

const ADR_FILE = /^ADR-(\d{3})-.+\.md$/;

export async function nextAdrNumber(root: string): Promise<string> {
  const dir = categoryDir(root, "adr");
  if (!(await fs.pathExists(dir))) return "001";
  const files = await fs.readdir(dir);
  let max = 0;
  for (const f of files) {
    const m = ADR_FILE.exec(f);
    if (m) {
      const n = parseInt(m[1]!, 10);
      if (n > max) max = n;
    }
  }
  return String(max + 1).padStart(3, "0");
}
