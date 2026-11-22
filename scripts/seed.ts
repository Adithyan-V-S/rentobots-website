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

payload.logger.info('Seed finished.')
process.exit(0)
