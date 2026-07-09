import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Engineering Vault",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    // No third-party analytics on a public knowledge base. Set a provider later if you want stats.
    analytics: null,
    locale: "en-US",
    // Published on GitHub Pages as a project page. (Change to a custom domain later if you want.)
    baseUrl: "M1re.github.io/EngineeringVault",
    // "Templates" (capital T) matters: GitHub's Linux runner is case-sensitive.
    ignorePatterns: ["private", "templates", "Templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Inter",
        body: "Inter",
        code: "IBM Plex Mono",
      },
      colors: {
        // Notion-inspired palette
        lightMode: {
          light: "#ffffff", // page background
          lightgray: "#e9e9e7", // borders / dividers
          gray: "#c7c6c3", // faint lines, graph links
          darkgray: "#37352f", // body text (Notion warm near-black)
          dark: "#2f2c26", // headings / strong text
          secondary: "#2383e2", // links / accent (Notion blue)
          tertiary: "#5b9bd5", // hover accent
          highlight: "rgba(55, 53, 47, 0.06)", // internal-link background
          textHighlight: "#fdecc8", // ==highlight== marker
        },
        darkMode: {
          light: "#191919", // page background
          lightgray: "#2f2f2f", // borders / dividers
          gray: "#5a5a5a", // faint lines, graph links
          darkgray: "#c5c5c5", // body text
          dark: "#eaeaea", // headings / strong text
          secondary: "#4a9eda", // links / accent
          tertiary: "#6cb6ff", // hover accent
          highlight: "rgba(255, 255, 255, 0.055)", // internal-link background
          textHighlight: "#e5b32e55", // ==highlight== marker
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
