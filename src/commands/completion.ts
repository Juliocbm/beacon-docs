import { renderBashCompletion } from "../completion/bash";
import { renderZshCompletion } from "../completion/zsh";
import { renderFishCompletion } from "../completion/fish";
import { SHELLS, type Shell } from "../completion/schema";
import { closestMatch } from "../ui/suggest";

export interface CompletionCommandResult {
  exitCode: 0 | 1;
  output: string;
  /** True when output should go to stderr (errors); false for the script itself. */
  isError: boolean;
}

const RENDERERS: Record<Shell, () => string> = {
  bash: renderBashCompletion,
  zsh: renderZshCompletion,
  fish: renderFishCompletion,
};

export function runCompletionCommand(opts: { shell: string }): CompletionCommandResult {
  const shell = opts.shell;
  if ((SHELLS as readonly string[]).includes(shell)) {
    return {
      exitCode: 0,
      output: RENDERERS[shell as Shell](),
      isError: false,
    };
  }
  const suggestion = closestMatch(shell, SHELLS);
  const hint = suggestion ? ` Did you mean "${suggestion}"?` : ` Supported shells: ${SHELLS.join(", ")}.`;
  return {
    exitCode: 1,
    output: `Unsupported shell: "${shell}".${hint}\n`,
    isError: true,
  };
}
