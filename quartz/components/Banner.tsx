import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot } from "../util/path"
import style from "./styles/banner.scss"

// Notion-style cover image / GIF. Reads the `banner` frontmatter field (the same
// field the Obsidian Banners plugin uses) so a page looks identical in Obsidian
// and on the deployed site. The value may be an external URL or a vault-relative
// path such as `attachments/banners/foo.gif`.
const Banner: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  // Covers belong to topics and sub-topics only — i.e. folder-notes.
  const tags = fileData.frontmatter?.tags
  const isFolderNote = Array.isArray(tags)
    ? tags.some((t) => String(t).toLowerCase() === "foldernote")
    : String(tags ?? "").toLowerCase() === "foldernote"
  if (!isFolderNote) {
    return null
  }

  const raw = fileData.frontmatter?.banner as string | undefined
  if (!raw || typeof raw !== "string") {
    return null
  }

  const isExternal = /^https?:\/\//.test(raw)
  // strip Obsidian wikilink wrapping (`[[...]]`) and any leading `./` or `/`
  const clean = raw.replace(/^!?\[\[/, "").replace(/\]\]$/, "").replace(/^\.?\//, "")
  const src = isExternal ? raw : `${pathToRoot(fileData.slug!)}/${clean}`

  return (
    <div class={classNames(displayClass, "banner")}>
      <img class="banner-img" src={src} alt="" loading="eager" />
    </div>
  )
}

Banner.css = style

export default (() => Banner) satisfies QuartzComponentConstructor
