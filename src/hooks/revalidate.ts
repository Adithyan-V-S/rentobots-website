import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * Each public page is built once and cached under the tag "page:<name>".
 * When content changes, the affected pages are marked stale here, so the
 * very next visitor gets a freshly built page — everyone else gets the
 * cached copy, which keeps the site fast.
 */
async function refresh(pages: string[], context: Record<string, unknown>) {
  if (context?.disableRevalidate) return
  try {
    const { revalidateTag } = await import('next/cache')
    // 'ALL' refreshes every page (e.g. robots appear in every footer).
    for (const p of pages) revalidateTag(p === 'ALL' ? 'site' : `page:${p}`, { expire: 0 })
  } catch {
    // Not running inside Next.js (e.g. the seed script) — nothing to refresh.
  }
}

export const revalidatePages = (pages: string[]) => {
  const afterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
    await refresh(pages, req.context)
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
    await refresh(pages, req.context)
    return doc
  }
  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}
