import type { Rule } from "../linter/types";
import type { Check } from "../doctor/types";

/**
 * Public plugin contract. Third-party packages export this as their default
 * (or named `plugin`) export to add doctor checks and lint rules to Beacon.
 *
 * v0.4 scope: checks + rules only. Categories and AI agents are deferred to v0.5.
 */
export interface BeaconPlugin {
  /** Unique plugin identifier — must be the npm package name or a stable path-based id. */
  name: string;
  /** Optional version (usually mirrors the plugin package's package.json version). */
  version?: string;
  /** Doctor checks contributed by this plugin. */
  checks?: Check[];
  /** Lint rules contributed by this plugin. */
  rules?: Rule[];
  /**
   * Optional `--explain` content. Keys are rule/check names; values are short
   * verbose docs surfaced by `beacon lint --explain <name>` and `beacon doctor --explain <name>`.
   */
  explain?: Record<string, PluginExplain>;
}

export interface PluginExplain {
  summary: string;
  why?: string;
  fix?: string;
}

/** A plugin successfully loaded from disk, paired with where it came from. */
export interface LoadedPlugin {
  plugin: BeaconPlugin;
  /** The string from the config that loaded this plugin (npm name or relative path). */
  source: string;
  /** Absolute path the loader actually resolved to. Useful for diagnostics. */
  resolvedPath: string;
}
