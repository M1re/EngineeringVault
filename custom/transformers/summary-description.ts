import type { QuartzTransformerPlugin } from "../../quartz/plugins/types"

// Our notes carry a one-line `summary` in frontmatter. Quartz's Description plugin reads
// `description`, so copy summary over (an explicit description still wins). Must run after the
// frontmatter is parsed and before Description; quartz.ts inserts it right before Description.
export const SummaryDescription: QuartzTransformerPlugin = () => ({
  name: "SummaryDescription",
  markdownPlugins() {
    return [
      () => (_tree, file) => {
        const fm = file.data.frontmatter as Record<string, unknown> | undefined
        if (fm && typeof fm.summary === "string" && fm.summary.trim() && !fm.description) {
          fm.description = fm.summary.trim()
        }
      },
    ]
  },
})
