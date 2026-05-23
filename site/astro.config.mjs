import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://beacon-docs.com",
  integrations: [
    starlight({
      title: "Beacon",
      tagline: "Trail markers for AI-collaborative codebases.",
      logo: {
        src: "./src/assets/logo.svg",
        replacesTitle: false,
      },
      favicon: "/favicon.svg",
      description:
        "Opinionated documentation convention + CLI that scaffolds the structure, generates per-vendor AI rule files (Claude, Cursor, Codex, Gemini), and lints the result.",
      social: {
        github: "https://github.com/Juliocbm/beacon-docs",
      },
      editLink: {
        baseUrl: "https://github.com/Juliocbm/beacon-docs/edit/main/site/",
      },
      lastUpdated: true,
      sidebar: [
        { label: "Install & quick start", link: "/install/" },
        { label: "Commands", link: "/commands/" },
        {
          label: "Reference",
          items: [
            {
              label: "Full README",
              link: "https://github.com/Juliocbm/beacon-docs#readme",
              attrs: { target: "_blank" },
            },
            {
              label: "ADRs",
              link: "https://github.com/Juliocbm/beacon-docs/tree/main/docs/adr",
              attrs: { target: "_blank" },
            },
            {
              label: "Backlog",
              link: "https://github.com/Juliocbm/beacon-docs/tree/main/docs/backlog",
              attrs: { target: "_blank" },
            },
          ],
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
