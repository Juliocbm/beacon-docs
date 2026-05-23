import ejs from "ejs";
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

function resolveTemplateDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.join(here, "templates", "frontmatter");
  if (fs.existsSync(candidate)) return candidate;
  return path.join(here, "..", "templates", "frontmatter");
}

const TEMPLATE_DIR = resolveTemplateDir();

export type DocType =
  | "plan"
  | "adr"
  | "pattern"
  | "eval"
  | "architecture"
  | "module"
  | "guide"
  | "roadmap"
  | "todo"
  | "business"
  | "compliance";

export interface RenderDocInput {
  type: DocType;
  title: string;
  today: string;
  number?: string;
}

export function renderDoc(input: RenderDocInput): string {
  const tplPath = path.join(TEMPLATE_DIR, `${input.type}.md.ejs`);
  const tpl = fs.readFileSync(tplPath, "utf8");
  return ejs.render(tpl, input);
}
