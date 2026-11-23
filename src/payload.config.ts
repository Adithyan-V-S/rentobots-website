import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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

// The site's own address(es). Saves made with the admin login cookie are only accepted
// from these origins (CSRF protection), so list every address the admin may be opened on.
const clean = (u?: string) => (u ? u.trim().replace(/\/+$/, '') : '')
const vercel = (host?: string) => (host ? `https://${host}` : '')
const SITE_URL = clean(process.env.NEXT_PUBLIC_SITE_URL) || vercel(process.env.VERCEL_PROJECT_PRODUCTION_URL) || 'http://localhost:3000'
const TRUSTED_ORIGINS = [
  SITE_URL,
  vercel(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  vercel(process.env.VERCEL_URL),
  vercel(process.env.VERCEL_BRANCH_URL),
  'http://localhost:3000',
].filter((v, i, a) => v && a.indexOf(v) === i)

export default buildConfig({
  serverURL: SITE_URL,
  csrf: TRUSTED_ORIGINS,
  cors: TRUSTED_ORIGINS,
  admin: {
    user: Users.slug,
    // Rentobots branding instead of Payload's.
    meta: {
      title: 'Admin',
      titleSuffix: ' — Rentobots',
      description: 'Rentobots website admin',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/assets/img/favicon.svg' }],
      openGraph: { title: 'Rentobots Admin', description: 'Rentobots website admin', siteName: 'Rentobots' },
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo',
        Icon: '/components/admin/Icon',
      },
    },
    theme: 'dark',
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
    // Production uses migrations (src/migrations); local dev updates tables automatically.
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  plugins: [
    // On Vercel, photos are stored in Vercel Blob (Vercel has no permanent disk).
    // On the VPS and locally there is no token, so photos stay in the /media folder.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: { disablePayloadAccessControl: true } }, // photos are public; serve straight from Blob CDN
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
      clientUploads: true, // upload straight from the browser, so large photos work
    }),
  ],
  sharp,
  telemetry: false,
})
