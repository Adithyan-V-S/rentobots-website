/**
 * One-off: give the D1 and Inspection Robo model cards the white-background D1 photo.
 * Safe to re-run (does nothing once both already use it).
 *
 *   npx payload run scripts/d1-white-photo.ts
 */
import path from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
const ALT = 'D1 quadruped robot with a chrome body and yellow accents, on a white background'

const robots = await payload.find({ collection: 'robots', where: { slug: { in: ['d1', 'inspection-robo'] } }, depth: 1, limit: 10 })
const todo = robots.docs.filter((r) => !(typeof r.photo === 'object' && r.photo?.filename?.startsWith('d1-white')))

if (todo.length === 0) {
  payload.logger.info('Both cards already use the white D1 photo — nothing to do.')
} else {
  const photo = await payload.create({
    collection: 'media',
    data: { alt: ALT, focalX: 52, focalY: 50 },
    filePath: path.join(process.cwd(), 'public', 'assets', 'img', 'd1-white.jpg'),
    context: { disableRevalidate: true },
  })
  for (const r of todo) {
    await payload.update({ collection: 'robots', id: r.id, data: { photo: photo.id }, context: { disableRevalidate: true } })
    payload.logger.info(`Photo updated: ${r.name}`)
  }
}
process.exit(0)
