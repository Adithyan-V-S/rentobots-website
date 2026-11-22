import fs from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { CaseStudy, Media, Product, Robot } from '../payload-types'

/**
 * The public pages are the original hand-built HTML files in /site.
 * Parts that come from the admin panel are marked in those files with
 * an HTML comment pair "cms:key" ... "/cms:key", or the same pair written
 * as JS block comments inside a script tag. They are replaced here with
 * content from the database. Everything else
 * is served exactly as designed.
 */

const SITE_DIR = path.join(process.cwd(), 'site')
const WHATSAPP = '917012230818'

export const PAGES = fs
  .readdir(SITE_DIR)
  .then((files) => files.filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, '')))

export async function pageExists(name: string) {
  return (await PAGES).includes(name)
}

// ---------- helpers ----------

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** JSON that is safe to place inside a <script> tag. */
const scriptJson = (v: unknown) =>
  JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028')
    .replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029')

function fill(html: string, key: string, value: string) {
  const k = key.replace(/[-]/g, '\\-')
  return html
    .replace(new RegExp(`<!--cms:${k}-->[\\s\\S]*?<!--/cms:${k}-->`, 'g'), () => value)
    .replace(new RegExp(`/\\*cms:${k}\\*/[\\s\\S]*?/\\*/cms:${k}\\*/`, 'g'), () => value)
}

/** Old links like "case-studies.html#x" become clean URLs like "/case-studies#x". */
function cleanLinks(html: string) {
  return html.replace(/href="([a-z0-9-]+)\.html(#[^"]*)?"/g, (_, page: string, hash = '') =>
    `href="${page === 'index' ? '/' : '/' + page}${hash}"`,
  )
}

const mediaOf = (m: number | Media | null | undefined): Media | null => (m && typeof m === 'object' ? m : null)
/** Site-relative URL (no "http://host"), so pages work on any domain. */
const rel = (u: string | null | undefined) => (u || '').replace(/^https?:\/\/[^/]+/, '')
const imgUrl = (m: Media | null) => (m ? rel(m.sizes?.card?.url || m.url) : '')
const imgPos = (m: Media | null) => (m ? `${m.focalX ?? 50}% ${m.focalY ?? 50}%` : 'center')
const robotLabel = (r: number | Robot) => (typeof r === 'object' ? `${r.name} · ${r.kind}` : '')

const CASE_CAT: Record<string, string> = {
  retail: 'Malls &amp; retail',
  corporate: 'Corporate',
  celebrations: 'Celebrations',
  education: 'Education',
}

// ---------- case studies ----------

function featuredHtml(c: CaseStudy) {
  const m = mediaOf(c.photo)
  const robots = (c.robots || []).map(robotLabel).filter(Boolean).join(', ')
  const label = c.featuredLabel ? esc(c.featuredLabel) : CASE_CAT[c.category]
  const facts = [
    c.place ? ['Venue', c.place] : null,
    robots ? ['Robot', robots] : null,
  ].filter(Boolean) as [string, string][]
  return `<article style="display: flex; flex-wrap: wrap; border: 1px solid #1b1c1e; border-radius: 24px; background: #07080a; overflow: hidden">
${m ? `<img fetchpriority="high" decoding="async" src="${esc(rel(m.url))}" alt="${esc(m.alt)}" style="flex: 1 1 440px; min-width: 0; width: 100%; height: 560px; object-fit: cover; object-position: ${imgPos(m)}">` : ''}
<div style="flex: 1 1 440px; min-width: 0; padding: 48px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; gap: 22px">
<div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">
<span style="font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; padding: 6px 12px; border-radius: 999px; background: #FF6363; color: #040506">Featured</span>
<span style="font-size: 13px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #8B8C8D">${label}</span>
</div>
<h2 style="margin: 0; font-family: 'Inter', sans-serif; font-weight: 600; font-size: clamp(32px, 3.6vw, 48px); line-height: 1.05; letter-spacing: 0">${esc(c.title)}</h2>
<p style="margin: 0; font-size: 17px; line-height: 1.65; color: #9C9C9D">${esc(c.featuredText || c.summary)}</p>
${facts.length ? `<dl style="margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr)); gap: 16px; padding: 20px 0; border-top: 1px solid #1b1c1e; border-bottom: 1px solid #1b1c1e">
${facts.map(([k, v]) => `<div><dt style="font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #8B8C8D">${k}</dt><dd style="margin: 6px 0 0; font-size: 16px; font-weight: 600">${esc(v)}</dd></div>`).join('\n')}
</dl>` : ''}
<a class="rb-ghost" href="#cs-${esc(c.slug)}" style="align-self: flex-start; min-height: 44px; box-sizing: border-box; display: inline-flex; align-items: center; padding: 12px 22px; border: 1px solid #363739; border-radius: 999px; font-size: 15px; font-weight: 600">Read the story</a>
</div>
</article>`
}

function caseCardHtml(c: CaseStudy) {
  const m = mediaOf(c.photo)
  const robots = (c.robots || []).map(robotLabel).filter(Boolean)
  const photo = m
    ? `<img loading="lazy" decoding="async" src="${esc(imgUrl(m))}" alt="${esc(m.alt)}" style="display: block; width: 100%; height: 240px; object-fit: cover; object-position: ${imgPos(m)}; border-bottom: 1px solid #1b1c1e">`
    : `<div class="rb-grid" role="img" aria-label="Photo placeholder" style="height: 240px; background-color: #111214; border-bottom: 1px solid #1b1c1e; display: flex; align-items: center; justify-content: center; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #8B8C8D">[Event photo]</div>`
  return `<article id="cs-${esc(c.slug)}" class="rb-card" style="border: 1px solid #1b1c1e; border-radius: 20px; background: #07080a; overflow: hidden; display: flex; flex-direction: column">
${photo}
<div style="padding: 28px; display: flex; flex-direction: column; gap: 16px">
<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap">
<span style="font-size: 12px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #E6E6E6">${CASE_CAT[c.category]}</span>
<span style="font-size: 13px; color: #8B8C8D">${esc(c.place)}</span>
</div>
<h3 style="margin: 0; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 24px; line-height: 1.2; letter-spacing: 0">${esc(c.title)}</h3>
<p style="margin: 0; font-size: 16px; line-height: 1.6; color: #9C9C9D">${esc(c.summary)}</p>
<div style="display: flex; flex-wrap: wrap; gap: 8px">
${robots.map((r) => `<span style="font-size: 13px; font-weight: 500; padding: 6px 12px; border: 1px solid #363739; border-radius: 999px; color: #9C9C9D">${esc(r)}</span>`).join('\n')}
</div>
<button type="button" aria-expanded="false" style="align-self: flex-start; min-height: 44px; padding: 10px 20px; border-radius: 999px; border: 1px solid #363739; background: transparent; color: #FFFFFF; font: inherit; font-size: 15px; font-weight: 600; cursor: pointer">Read the story</button>
</div>
</article>`
}

/** Data for the page's interactive filter/expand script (same shape it always used). */
function caseData(c: CaseStudy) {
  const m = mediaOf(c.photo)
  return {
    id: c.slug,
    cat: c.category,
    place: c.place || '',
    robots: (c.robots || []).map(robotLabel).filter(Boolean),
    photo: imgUrl(m),
    pos: imgPos(m),
    alt: m?.alt || 'Photo placeholder',
    title: c.title,
    summary: c.summary,
    brief: c.brief || '',
    did: c.whatWeDid || '',
    outcome: c.result || '',
  }
}

async function renderCaseStudies(html: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: { published: { equals: true } },
    sort: 'sortOrder',
    depth: 1,
    limit: 200,
    overrideAccess: false,
  })
  const featured = docs.find((d) => d.featured)
  html = fill(html, 'featured', featured ? featuredHtml(featured) : '')
  if (!featured) {
    // No featured story: drop the empty section entirely.
    html = html.replace(/<section aria-label="Featured case study"[^>]*>\s*<\/section>\s*/g, '')
  }
  html = fill(html, 'cards', docs.map(caseCardHtml).join('\n\n'))
  html = fill(html, 'count', String(docs.length))
  html = fill(html, 'cases', scriptJson(docs.map(caseData)))
  return html
}

// ---------- products ----------

const PRODUCT_CAT: Record<string, string> = { humanoid: 'Humanoid', quadruped: 'Quadruped', cobot: 'Cobot' }

function productHtml(p: Product, i: number) {
  const m = mediaOf(p.image)
  const msg = `Hi Rentobots, I'm interested in the ${p.name}. Please share details and pricing.`
  const specs = (p.specs || []).map((s) => s.text).filter(Boolean)
  const w = m?.sizes?.card?.width || m?.width || 960
  const h = m?.sizes?.card?.height || m?.height || 720
  return `<article class="rb-card rb-prod" data-cat="${esc(p.category)}" id="${esc(p.slug)}" style="border: 1px solid #1b1c1e; border-radius: 18px; background: #07080a; overflow: hidden; display: flex; flex-direction: column">
<img ${i < 3 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" src="${esc(imgUrl(m))}" alt="${esc(m?.alt || p.name)}" width="${w}" height="${h}" style="display: block; width: 100%; height: auto; aspect-ratio: 4 / 3; object-fit: cover; object-position: ${imgPos(m)}; background: #111214">
<div style="padding: 24px; display: flex; flex-direction: column; gap: 14px; flex-grow: 1">
<span style="font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #8B8C8D">${PRODUCT_CAT[p.category]}</span>
<h3 style="margin: 0; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 22px; line-height: 1.2">${esc(p.name)}</h3>
<p style="margin: 0; flex-grow: 1; font-size: 15px; line-height: 1.6; color: #9C9C9D">${esc(p.description)}</p>
${specs.length ? `<ul aria-label="Key specs" style="margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px">${specs.map((s) => `<li style="font-size: 13px; padding: 6px 10px; border: 1px solid #2F3031; border-radius: 6px; color: #E6E6E6">${esc(s)}</li>`).join('')}</ul>` : ''}
<a class="rb-ghost" href="https://wa.me/${WHATSAPP}?text=${esc(encodeURIComponent(msg))}" target="_blank" rel="noopener" style="margin-top: 6px; color: #FFFFFF; padding: 12px 18px; border: 1px solid #363739; font-size: 14px; font-weight: 600; min-height: 44px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 8px">Enquire on WhatsApp <span aria-hidden="true">→</span></a>
</div>
</article>`
}

async function renderProducts(html: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'products',
    where: { published: { equals: true } },
    sort: 'sortOrder',
    depth: 1,
    limit: 500,
    overrideAccess: false,
  })
  html = fill(html, 'products', docs.map(productHtml).join('\n'))
  html = fill(html, 'n-all', String(docs.length))
  for (const cat of Object.keys(PRODUCT_CAT)) {
    html = fill(html, `n-${cat}`, String(docs.filter((d) => d.category === cat).length))
  }
  return html
}

// ---------- entry ----------

const RENDERERS: Record<string, (html: string) => Promise<string>> = {
  'case-studies': renderCaseStudies,
  products: renderProducts,
}

export async function renderPage(name: string) {
  let html = await fs.readFile(path.join(SITE_DIR, `${name}.html`), 'utf8')
  const r = RENDERERS[name]
  if (r) html = await r(html)
  return cleanLinks(html)
}
