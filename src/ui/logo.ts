import { c } from "./colors";

export const TAGLINE = "Trail markers for AI-collaborative codebases.";

const LOGO_LINES = [
  "   ╱╲",
  "  ╱  ╲",
  " ╱────╲",
  "╱──────╲",
];

export function renderLogo(version: string): string {
  const lines = LOGO_LINES.map((line, i) => {
    const colored = c.cyan(c.bold(line));
    // Decorate line 1 with "beacon" name, line 3 with version + URL
    if (i === 1) return `${colored}   ${c.bold("beacon")}`;
    if (i === 3) return `${colored} ${c.dim(`v${version}  ·  https://beacon-docs.com`)}`;
    return colored;
  });
  return lines.join("\n") + "\n";
}
