import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  shims: false,
  sourcemap: true,
  banner: { js: "#!/usr/bin/env node" },
  splitting: false,
  treeshake: true,
});
