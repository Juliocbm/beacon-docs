import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { BeaconPlugin, LoadedPlugin } from "./types";

export interface LoadPluginsOptions {
  /** Project root — relative plugin paths resolve against this. */
  root: string;
  /** Raw plugin sources from `BeaconConfig.plugins` (npm names or `./` paths). */
  sources: string[];
}

export interface LoadPluginsResult {
  plugins: LoadedPlugin[];
  errors: PluginLoadError[];
}

export interface PluginLoadError {
  source: string;
  message: string;
}

/**
 * Resolve a plugin source string to an absolute path that can be `import()`-ed.
 *
 * Two kinds of sources are supported:
 *   1. Relative path — starts with `./` or `../`. Resolved against `root`.
 *   2. npm package name — anything else. Resolved via Node's package resolution
 *      starting from `root` (so the plugin must be installed in the project's
 *      node_modules, not globally with the CLI).
 *
 * Throws with a friendly message if the source cannot be resolved.
 */
export function resolvePluginPath(source: string, root: string): string {
  const trimmed = source.trim();
  if (trimmed === "") {
    throw new Error(`Plugin source is empty.`);
  }
  if (trimmed.startsWith("./") || trimmed.startsWith("../") || path.isAbsolute(trimmed)) {
    return path.resolve(root, trimmed);
  }
  // npm package — resolve from the project root, not from where Beacon is installed.
  // We construct a require relative to a fake file inside the project root.
  const projectRequire = createRequire(path.join(root, "noop.js"));
  try {
    return projectRequire.resolve(trimmed);
  } catch {
    throw new Error(
      `Cannot find plugin "${trimmed}". Install it with \`npm install ${trimmed}\` in this project.`,
    );
  }
}

/**
 * Validate the shape of a loaded plugin object. Throws on missing required
 * fields. Empty plugins (no checks AND no rules) are allowed but warned about
 * via the caller; here we only check the contract.
 */
export function assertValidPlugin(value: unknown, source: string): asserts value is BeaconPlugin {
  if (!value || typeof value !== "object") {
    throw new Error(`Plugin "${source}" did not export a plugin object.`);
  }
  const plugin = value as Partial<BeaconPlugin>;
  if (typeof plugin.name !== "string" || plugin.name.trim() === "") {
    throw new Error(`Plugin "${source}" is missing the required \`name\` field.`);
  }
  if (plugin.checks !== undefined && !Array.isArray(plugin.checks)) {
    throw new Error(`Plugin "${source}" has a \`checks\` field that is not an array.`);
  }
  if (plugin.rules !== undefined && !Array.isArray(plugin.rules)) {
    throw new Error(`Plugin "${source}" has a \`rules\` field that is not an array.`);
  }
}

/**
 * Load all plugins listed in `sources`. Errors loading individual plugins
 * are accumulated rather than thrown — a misconfigured plugin should not
 * brick `beacon doctor` or `beacon lint`.
 */
export async function loadPlugins(opts: LoadPluginsOptions): Promise<LoadPluginsResult> {
  const plugins: LoadedPlugin[] = [];
  const errors: PluginLoadError[] = [];

  for (const source of opts.sources) {
    try {
      const resolvedPath = resolvePluginPath(source, opts.root);
      const mod = (await import(pathToFileURL(resolvedPath).href)) as Record<string, unknown>;
      // Accept either a default export or a named `plugin` export.
      const candidate = mod.default ?? mod.plugin ?? mod;
      assertValidPlugin(candidate, source);
      plugins.push({ plugin: candidate, source, resolvedPath });
    } catch (err) {
      errors.push({
        source,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { plugins, errors };
}
