/**
 * One-time import of the current website content into the database.
 * Reads the original HTML pages in /site and the images in /public/assets.
 * Safe to re-run: it skips anything that already exists.
 *
 *   npm run seed
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'

const ROOT = process.cwd()
const site = (f: string) => fs.readFileSync(path.join(ROOT, 'site', f), 'utf8')
const asset = (src: string) => path.join(ROOT, 'public', src.replace(/^\//, ''))
const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

const payload = await getPayload({ config })
const ctx = { disableRevalidate: true }

const mediaCache = new Map<string, number>()
async function media(src: string, alt: string, focalY = 50) {
  const key = src + '|' + focalY
  if (mediaCache.has(key)) return mediaCache.get(key)!
  const doc = await payload.create({
    collection: 'media',
    data: { alt, focalX: 50, focalY },
    filePath: asset(src),
    context: ctx,
  })
  mediaCache.set(key, doc.id)
  return doc.id
}
const focalY = (pos: string) => {
  const m = /(\d+)%\s*$/.exec(pos || '')
  return m ? Number(m[1]) : 50
}

// ---------- robots ----------
async function robot(name: string, kind: string) {
  const found = await payload.find({ collection: 'robots', where: { name: { equals: name } }, limit: 1 })
  if (found.docs[0]) return found.docs[0].id
  return (await payload.create({ collection: 'robots', data: { name, kind }, context: ctx })).id
}
const robotIds: Record<string, number> = {
  'Pachu · Humanoid': await robot('Pachu', 'Humanoid'),
  'Kuttappan · Robot dog': await robot('Kuttappan', 'Robot dog'),
}

// ---------- case studies ----------
const existingCases = await payload.count({ collection: 'case-studies' })
if (existingCases.totalDocs === 0) {
  const html = site('case-studies.html')
  const arr = /\/\*cms:cases\*\/([\s\S]*?)\/\*\/cms:cases\*\//.exec(html)![1]
  const all = new Function('P', 'K', `return ${arr}`)('Pachu · Humanoid', 'Kuttappan · Robot dog') as Array<
    Record<string, any>
  >

  // Featured story text, from the big block at the top of the page.
  const feat = /<!--cms:featured-->([\s\S]*?)<!--\/cms:featured-->/.exec(html)![1]
  const featHref = /href="#cs-([^"]+)"/.exec(feat)![1]
  const featLabel = decode(/color: #8B8C8D">([^<]+)<\/span>\s*<\/div>/.exec(feat)![1])
  const featText = decode(/<p [^>]*>([^<]+)<\/p>/.exec(feat)![1])

  let order = 10
  for (const c of all) {
    const photo = c.photo ? await media(c.photo, c.alt, focalY(c.pos)) : undefined
    await payload.create({
      collection: 'case-studies',
      data: {
        title: c.title,
        slug: c.id,
        category: c.cat,
        place: c.place || undefined,
        robots: (c.robots || []).map((r: string) => robotIds[r]).filter(Boolean),
        photo,
        summary: c.summary,
        brief: c.brief || undefined,
        whatWeDid: c.did || undefined,
        result: c.outcome || undefined,
        featured: c.id === featHref,
        featuredLabel: c.id === featHref ? featLabel : undefined,
        featuredText: c.id === featHref ? featText : undefined,
        published: true,
        sortOrder: order,
      },
      context: ctx,
    })
    order += 10
    payload.logger.info(`Case study: ${c.title}`)
  }
} else {
  payload.logger.info('Case studies already exist — skipped.')
}

// ---------- products ----------
const existingProducts = await payload.count({ collection: 'products' })
if (existingProducts.totalDocs === 0) {
  const html = site('products.html')
  const articles = html.match(/<article class="rb-card rb-prod"[\s\S]*?<\/article>/g) || []
  let order = 10
  for (const a of articles) {
    const slug = /id="([^"]+)"/.exec(a)![1]
    const category = /data-cat="([^"]+)"/.exec(a)![1] as 'humanoid' | 'quadruped' | 'cobot'
    const src = /<img[^>]*src="([^"]+)"/.exec(a)![1]
    const alt = decode(/<img[^>]*alt="([^"]*)"/.exec(a)![1])
    const name = decode(/<h3[^>]*>([^<]+)<\/h3>/.exec(a)![1])
    const description = decode(/<p[^>]*>([^<]+)<\/p>/.exec(a)![1])
    const specs = [...a.matchAll(/<li[^>]*>([^<]+)<\/li>/g)].map((m) => ({ text: decode(m[1]) }))
    await payload.create({
      collection: 'products',
      data: { name, slug, category, image: await media(src, alt), description, specs, published: true, sortOrder: order },
      context: ctx,
    })
    order += 10
    payload.logger.info(`Product: ${name}`)
  }
} else {
  payload.logger.info('Products already exist — skipped.')
}

// ---------- robot models (details for /robot-models) ----------
{
  const html = site('robot-models.html')
  const block = /<!--cms:robots-->([\s\S]*?)<!--\/cms:robots-->/.exec(html)![1]
  const tbody = /<!--cms:compare-->([\s\S]*?)<!--\/cms:compare-->/.exec(html)![1]
  const sections = block.match(/<section id="[^"]+"[\s\S]*?<\/section>/g) || []
  // Robots already offered in the booking form on the hire page.
  const hireIds = [...site('hire.html').matchAll(/\{ id: '([a-z0-9-]+)', name:/g)].map((m) => m[1])
  let order = 10
  for (const s of sections) {
    const slug = /<section id="([^"]+)"/.exec(s)![1]
    const name = decode(/<h2[^>]*>([^<]+)<\/h2>/.exec(s)![1])
    const meta = decode(/letter-spacing: 0\.2em; text-transform: uppercase; color: #8B8C8D">([^<]+)<\/span>/.exec(s)![1])
    const [kind, model] = meta.split(' · ')
    const img = /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*object-position: ([^;]+);/.exec(s)!
    const pos = img[3].trim().split(/\s+/)
    const pct = (v: string) => (v === 'center' ? 50 : parseFloat(v))
    const description = decode(/<p style="margin: 0; font-size: 18px[^>]*>([^<]+)<\/p>/.exec(s)?.[1] || '')
    const capabilities = [...s.matchAll(/<li[^>]*><span class="rb-rule"[^>]*><\/span>([^<]+)<\/li>/g)].map((m) => ({ text: decode(m[1]) }))
    const greatFor = decode(/Great for<\/span> ([^<]+)<\/p>/.exec(s)?.[1] || '')
    const row = new RegExp(`<th scope="row"[^>]*>${name}</th>\\s*<td[^>]*>[^<]*</td>\\s*<td[^>]*>[^<]*</td>\\s*<td[^>]*>([^<]*)</td>`).exec(tbody)
    const photo = (
      await payload.create({
        collection: 'media',
        data: { alt: decode(img[2]), focalX: pct(pos[0]), focalY: pct(pos[1] ?? '50') },
        filePath: asset(img[1]),
        context: ctx,
      })
    ).id
    const data = {
      name,
      kind,
      model,
      slug,
      photo,
      description,
      capabilities,
      greatFor,
      bestMoment: row ? decode(row[1]) : '',
      isNew: s.includes('>New</span>'),
      showOnModelsPage: true,
      bookable: hireIds.includes(slug),
      sortOrder: order,
    }
    const found = await payload.find({ collection: 'robots', where: { name: { equals: name } }, limit: 1 })
    if (found.docs[0]?.slug) {
      payload.logger.info(`Robot model ${name} already has details — skipped.`)
    } else if (found.docs[0]) {
      await payload.update({ collection: 'robots', id: found.docs[0].id, data, context: ctx })
      payload.logger.info(`Robot model updated: ${name}`)
    } else {
      await payload.create({ collection: 'robots', data, context: ctx })
      payload.logger.info(`Robot model added: ${name}`)
    }
    order += 10
  }
}

// ---------- programs ----------
if ((await payload.count({ collection: 'programs' })).totalDocs === 0) {
  const html = site('programs.html')
  const block = /<!--cms:programs-->([\s\S]*?)<!--\/cms:programs-->/.exec(html)![1]
  let order = 10
  for (const li of block.match(/<li[\s\S]*?<\/li>/g) || []) {
    const dd = (label: string) =>
      decode(new RegExp(`<dt[^>]*>${label}</dt><dd[^>]*>([^<]*)</dd>`).exec(li)?.[1] || '')
    await payload.create({
      collection: 'programs',
      data: {
        title: decode(/<h3[^>]*>([^<]+)<\/h3>/.exec(li)![1]),
        stage: decode(/font-size: 11px; font-weight: 600; letter-spacing: 0\.16em[^>]*>([^<]+)<\/span>/.exec(li)?.[1] || ''),
        summary: decode(/<p[^>]*>([^<]+)<\/p>/.exec(li)![1]),
        duration: dd('Duration'),
        group: dd('Group'),
        detailPage: /href="(programs-[a-z-]+)\.html"/.exec(li)?.[1] as never,
        highlight: li.includes('border: 2px solid'),
        badge: decode(/background: #FF6363; color: #040506">([^<]+)<\/span>/.exec(li)?.[1] || '') || undefined,
        published: true,
        sortOrder: order,
      },
      context: ctx,
    })
    order += 10
  }
  payload.logger.info('Programs imported.')
}

// ---------- FAQs (merged across pages; same question → one FAQ on several pages) ----------
if ((await payload.count({ collection: 'faqs' })).totalDocs === 0) {
  const pages = ['index', 'hire', 'programs', 'partner', 'china-tour'] as const
  const byQ = new Map<string, { answer: string; pages: string[]; order: number }>()
  let order = 10
  for (const p of pages) {
    const html = site(`${p}.html`)
    const block = /<!--cms:faq-->([\s\S]*?)<!--\/cms:faq-->/.exec(html)![1]
    for (const d of block.match(/<details[\s\S]*?<\/details>/g) || []) {
      const q = decode(/<summary[^>]*>([\s\S]*?)<span class="rb-plus"/.exec(d)![1].trim())
      const a = decode(/<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>/.exec(d)![1].trim())
      const prev = byQ.get(q)
      if (prev) prev.pages.push(p)
      else byQ.set(q, { answer: a, pages: [p], order: (order += 10) })
    }
  }
  for (const [question, f] of byQ) {
    await payload.create({
      collection: 'faqs',
      data: { question, answer: f.answer, pages: f.pages as never, published: true, sortOrder: f.order },
      context: ctx,
    })
  }
  payload.logger.info(`FAQs imported: ${byQ.size}`)
}

payload.logger.info('Seed finished.')
process.exit(0)
