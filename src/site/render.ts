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

// ---------- robot models ----------

async function getModels() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'robots',
    where: { showOnModelsPage: { equals: true } },
    sort: 'sortOrder',
    depth: 1,
    limit: 100,
  })
  return docs.filter((r) => r.slug)
}

function robotSectionHtml(r: Robot, i: number) {
  const m = mediaOf(r.photo)
  const even = i % 2 === 1
  const n = String(i + 1).padStart(2, '0')
  const meta = [r.kind, r.model].filter(Boolean).map(esc).join(' · ')
  const img = m
    ? `<img ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" src="${esc(rel(m.url))}" alt="${esc(m.alt)}" style="flex: 1 1 420px; min-width: 0; width: 100%; height: 620px; object-fit: cover; object-position: ${imgPos(m)}; border-radius: 24px; border: 1px solid #1b1c1e; background: #1b1c1e">`
    : ''
  const caps = (r.capabilities || []).map((c) => c.text).filter(Boolean)
  const text = `<div style="flex: 1 1 460px; min-width: 0; display: flex; flex-direction: column; gap: 24px">
<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px">
<span class="rb-grad" style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 20px">${n}</span>
<span style="font-size: 13px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #8B8C8D">${meta}</span>
${r.isNew ? `<span style="font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 12px; border-radius: 999px; background: #FF6363; color: #040506">New</span>` : ''}
</div>
<h2 style="margin: 0; font-family: 'Inter', sans-serif; font-weight: 600; font-size: clamp(48px, 6vw, 80px); line-height: 0.95; letter-spacing: 0">${esc(r.name)}</h2>
${r.description ? `<p style="margin: 0; font-size: 18px; line-height: 1.65; color: #9C9C9D">${esc(r.description)}</p>` : ''}
${caps.length ? `<div style="display: flex; flex-direction: column; gap: 12px">
<h3 style="margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #E6E6E6">What ${esc(r.name)} does</h3>
<ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 10px 24px; font-size: 16px; color: #E6E6E6">
${caps.map((c) => `<li style="display: flex; gap: 10px; align-items: center"><span class="rb-rule" style="width: 8px; height: 8px; border-radius: 2px; flex: none"></span>${esc(c)}</li>`).join('\n')}
</ul>
</div>` : ''}
${r.greatFor ? `<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #8B8C8D"><span style="color: #E6E6E6; font-weight: 600">Great for</span> ${esc(r.greatFor)}</p>` : ''}
<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px; padding-top: 24px; border-top: 1px solid #1b1c1e">
<a class="rb-btn" href="hire.html" style="color: #FFFFFF; padding: 16px 26px; border-radius: 999px; font-size: 15px; font-weight: 600; min-height: 44px; box-sizing: border-box; display: inline-flex; align-items: center">Book ${esc(r.name)}</a>
</div>
</div>`
  return `<section id="${esc(r.slug)}" style="border-top: 1px solid #1b1c1e${even ? '; background: #040506' : ''}">
<div style="max-width: 1280px; margin: 0 auto; padding: 88px 28px; display: flex; flex-wrap: ${even ? 'wrap-reverse' : 'wrap'}; align-items: center; gap: 56px">
${even ? `${text}\n${img}` : `${img}\n${text}`}
</div>
</section>`
}

function compareRowsHtml(robots: Robot[]) {
  return robots
    .map(
      (r, i) => `<tr${i < robots.length - 1 ? ' style="border-bottom: 1px solid #1b1c1e"' : ''}>
<th scope="row" style="padding: 22px 24px; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 20px">${esc(r.name)}</th>
<td style="padding: 22px 24px; color: #9C9C9D">${esc(r.kind)}</td>
<td style="padding: 22px 24px; color: #9C9C9D">${esc(r.model)}</td>
<td style="padding: 22px 24px; color: #9C9C9D">${esc(r.bestMoment)}</td>
</tr>`,
    )
    .join('\n')
}

async function renderRobotModels(html: string) {
  const robots = await getModels()
  html = fill(html, 'robots', robots.map(robotSectionHtml).join('\n\n'))
  html = fill(html, 'compare', compareRowsHtml(robots))
  return html
}

/** Footer "Models" list on every page. Keeps each page's own link style. */
async function renderFooterModels(html: string) {
  if (!html.includes('<!--cms:footer-models-->')) return html
  const robots = await getModels()
  return html.replace(/<!--cms:footer-models-->([\s\S]*?)<!--\/cms:footer-models-->/g, (_, block: string) => {
    const first = /<li><a href="([^"#]*)#[^"]*"([^>]*)>[^<]*<\/a><\/li>/.exec(block)
    const prefix = first ? first[1] : 'robot-models.html'
    const attrs = first ? first[2] : ''
    return robots.map((r) => `<li><a href="${prefix}#${esc(r.slug)}"${attrs}>${esc(r.name)}</a></li>`).join('\n')
  })
}

// ---------- programs ----------

async function renderPrograms(html: string) {
  const payload = await getPayload({ config })
  const [{ docs }, op] = await Promise.all([
    payload.find({ collection: 'programs', where: { published: { equals: true } }, sort: 'sortOrder', limit: 50 }),
    payload.findGlobal({ slug: 'operator-workshop' }),
  ])
  const items = docs.map((p, i) => {
    const hl = Boolean(p.highlight)
    const box = hl ? 'background: #111214; border: 2px solid #E6E6E6;' : 'background: #07080a; border: 1px solid #1b1c1e;'
    const facts = [
      p.duration ? ['Duration', p.duration] : null,
      p.group ? ['Group', p.group] : null,
    ].filter(Boolean) as [string, string][]
    return `
<li style="padding: 28px 32px; border-radius: 20px; display: flex; flex-wrap: wrap; align-items: center; gap: 24px 40px; box-sizing: border-box; ${box}">
<div style="flex: 0 0 64px; display: flex; flex-direction: column; gap: 6px">
<span class="rb-grad" style="font-family: 'Inter', sans-serif; font-weight: 600; font-size: 32px; line-height: 1">${String(i + 1).padStart(2, '0')}</span>
<span style="font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #8B8C8D">${esc(p.stage)}</span>
</div>
<div style="flex: 1 1 380px; min-width: 0; display: flex; flex-direction: column; gap: 10px">
<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px">
<h3 style="margin: 0; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 26px; line-height: 1.15; letter-spacing: 0">${esc(p.title)}</h3>
${p.badge ? `<span style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 5px 10px; border-radius: 999px; background: #FF6363; color: #040506">${esc(p.badge)}</span>` : ''}
</div>
<p style="margin: 0; font-size: 16px; line-height: 1.6; color: #9C9C9D; max-width: 560px">${esc(p.summary)}</p>
</div>
<dl style="flex: 0 1 260px; margin: 0; display: flex; gap: 28px">
${facts.map(([k, v]) => `<div><dt style="font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: #8B8C8D">${k}</dt><dd style="margin: 6px 0 0; font-size: 17px; font-weight: 600; white-space: nowrap">${esc(v)}</dd></div>`).join('\n')}
</dl>
${p.detailPage ? `<a class="rb-ghost" href="${p.detailPage}.html" aria-label="View the ${esc(p.title)}${/program$/i.test(p.title) ? '' : ' program'}" style="flex: 0 0 auto; color: #FFFFFF; padding: 12px 22px; border-radius: 999px; border: 1px solid #363739; font-size: 14px; font-weight: 600; min-height: 44px; box-sizing: border-box; display: inline-flex; align-items: center; white-space: nowrap">View program →</a>` : ''}
</li>
`
  })
  html = fill(html, 'programs', items.join(''))
  html = fill(html, 'op-format', esc(op.format))
  html = fill(html, 'op-seats', esc(op.seats ?? ''))
  html = fill(html, 'op-next', esc(op.nextBatch))
  return html
}

// ---------- FAQs (any page with a marked FAQ list) ----------

async function renderFaqs(name: string, html: string) {
  if (!html.includes('<!--cms:faq-->')) return html
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'faqs',
    where: { and: [{ published: { equals: true } }, { pages: { contains: name } }] },
    sort: 'sortOrder',
    limit: 100,
  })
  // Each FAQ list reuses its own first item as the design, so every page keeps its look.
  html = html.replace(/<!--cms:faq-->([\s\S]*?)<!--\/cms:faq-->/g, (_, block: string) => {
    const pattern = /<details[\s\S]*?<\/details>/.exec(block)![0]
    return docs
      .map((f) =>
        pattern
          .replace(/(<summary[^>]*>)[\s\S]*?(<span class="rb-plus")/, (_m, a, b) => `${a}${esc(f.question)}${b}`)
          .replace(/(<\/summary>\s*<p[^>]*>)[\s\S]*?(<\/p>\s*<\/details>)/, (_m, a, b) => `${a}${esc(f.answer)}${b}`),
      )
      .join('\n')
  })
  // Keep Google's FAQ data in the page head in step with the visible questions.
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g, (whole, a, json, b) => {
    try {
      const data = JSON.parse(json)
      const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data]
      const faq = nodes.find((n: { '@type'?: string }) => n['@type'] === 'FAQPage')
      if (!faq) return whole
      faq.mainEntity = docs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      }))
      return `${a}\n${JSON.stringify(data, null, 1).replace(/</g, '\\u003c')}\n${b}`
    } catch {
      return whole
    }
  })
  return html
}

// ---------- entry ----------

const RENDERERS: Record<string, (html: string) => Promise<string>> = {
  'case-studies': renderCaseStudies,
  products: renderProducts,
  'robot-models': renderRobotModels,
  programs: renderPrograms,
}

export async function renderPage(name: string) {
  let html = await fs.readFile(path.join(SITE_DIR, `${name}.html`), 'utf8')
  const r = RENDERERS[name]
  if (r) html = await r(html)
  html = await renderFaqs(name, html)
  html = await renderFooterModels(html)
  return cleanLinks(html)
}
