import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// Order the Explorer by our curriculum (Programming → DevOps) instead of alphabetically.
// NOTE: this function is serialized to a string and run on the client, so it must be
// self-contained — the order list lives inside it, with no outside references.
const sortSections = (a: any, b: any) => {
  const order = [
    "Programming",
    "Computer-Science",
    "Data-Persistence",
    "Networks",
    "Architecture",
    "AI-and-ML",
    "Security",
    "Cloud",
    "DevOps",
  ]
  const ia = order.indexOf(a.slugSegment)
  const ib = order.indexOf(b.slugSegment)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  // fall back to Quartz's default: folders first, then alphabetical
  if (a.isFolder && !b.isFolder) return -1
  if (!a.isFolder && b.isFolder) return 1
  return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: "base" })
}

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Banner(),
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({ folderDefaultState: "open", sortFn: sortSections }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Banner(),
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({ folderDefaultState: "open", sortFn: sortSections }),
  ],
  right: [],
}
