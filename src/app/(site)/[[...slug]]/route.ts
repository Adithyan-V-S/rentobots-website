import { unstable_cache } from 'next/cache'

import { pageExists, renderPage } from '@/site/render'

/**
 * Serves every public page ("/", "/case-studies", "/products", ...).
 * Each page is built once and cached; editing content in the admin panel
 * marks only the affected page stale (see hooks/revalidate.ts).
 */

const cachedPage = (name: string) =>
  process.env.NODE_ENV === 'development'
    ? renderPage(name) // always fresh while developing
    : unstable_cache(() => renderPage(name), ['page', name], { tags: [`page:${name}`, 'site'] })()

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  // Browsers revalidate; Cloudflare may keep a copy for 60s and serve stale while refreshing.
  'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600',
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const name = !slug || slug.length === 0 ? 'index' : slug.length === 1 ? slug[0] : ''

  if (name && name !== '404' && (await pageExists(name))) {
    return new Response(await cachedPage(name), { headers: HTML_HEADERS })
  }
  return new Response(await cachedPage('404'), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
