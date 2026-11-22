import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Robots } from './collections/Robots'
import { CaseStudies } from './collections/CaseStudies'
import { Products } from './collections/Products'
import { Bookings } from './collections/Bookings'
import { Faqs } from './collections/Faqs'
import { Programs } from './collections/Programs'
import { OperatorWorkshop } from './globals/OperatorWorkshop'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' — Rentobots admin' },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [CaseStudies, Products, Robots, Programs, Faqs, Media, Bookings, Users],
  globals: [OperatorWorkshop],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
  }),
  sharp,
  telemetry: false,
})
