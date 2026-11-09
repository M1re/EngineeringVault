// Order the Explorer by our curriculum (Programming → DevOps) instead of alphabetically.
// The Explorer serializes this function to a string and runs it in the browser, so it must be
// self-contained: the order list lives inside it, with no outside references.
export const sortSections = (a: any, b: any) => {
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
  return a.displayName.localeCompare(b.displayName, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}
