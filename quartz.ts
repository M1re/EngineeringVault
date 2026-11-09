import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { PageTypes } from "./quartz/plugins"
import { componentRegistry } from "./quartz/components/registry"
import type { QuartzComponent, QuartzComponentConstructor } from "./quartz/components/types"
import Banner from "./custom/components/banner"
import { sortSections } from "./custom/explorer-order"
import { SummaryDescription } from "./custom/transformers/summary-description"

// Engineering Vault customizations. This file is Quartz's sanctioned override entrypoint;
// our code lives here and under ./custom so `npx quartz upgrade` never touches it.

const config = await loadQuartzConfig()
export default config

// `summary` frontmatter feeds the page description (search snippets, link previews).
const descIdx = config.plugins.transformers.findIndex((t) => t.name === "Description")
config.plugins.transformers.splice(
  descIdx === -1 ? config.plugins.transformers.length : descIdx,
  0,
  SummaryDescription(),
)

const layout = await loadQuartzLayout()

// Explorer: open folders and curriculum order. sortFn is a function, which YAML cannot hold, so
// the plugin is registered without a layout slot in quartz.config.yaml and placed here.
const explorerReg = componentRegistry.get("explorer") ?? componentRegistry.get("Explorer")
if (!explorerReg)
  throw new Error("quartz.ts: the explorer plugin must be enabled in quartz.config.yaml")
const explorer = componentRegistry.instantiate(
  explorerReg.component as QuartzComponentConstructor,
  { folderDefaultState: "open", sortFn: sortSections } as any,
)

// Cover banner sits above the breadcrumbs/title on folder-notes (it renders nothing elsewhere).
const banner = Banner()

const withBanner = (items: QuartzComponent[] | undefined) => [banner, ...(items ?? [])]
const withExplorer = (items: QuartzComponent[] | undefined) => [...(items ?? []), explorer]

layout.defaults.beforeBody = withBanner(layout.defaults.beforeBody)
layout.defaults.left = withExplorer(layout.defaults.left)
for (const [type, page] of Object.entries(layout.byPageType)) {
  if (type === "404") continue
  if (page.beforeBody === undefined || page.beforeBody.length > 0) {
    page.beforeBody = withBanner(page.beforeBody ?? layout.defaults.beforeBody?.slice(1))
  }
  if (page.left === undefined || page.left.length > 0) {
    page.left = withExplorer(page.left ?? layout.defaults.left?.slice(0, -1))
  }
}

// Quartz 5.0.0 bakes the layout into the PageTypeDispatcher emitter while loading the config,
// so swap that emitter for one built from the customized layout.
const dispatcherIdx = config.plugins.emitters.findIndex((e) => e.name === "PageTypeDispatcher")
if (dispatcherIdx === -1) throw new Error("quartz.ts: PageTypeDispatcher emitter not found")
config.plugins.emitters[dispatcherIdx] = PageTypes.PageTypeDispatcher({
  defaults: layout.defaults,
  byPageType: layout.byPageType,
})

export { layout }
