import type { CollectionConfig } from 'payload'

import { adminsOnly, anyone } from '../access'
import { revalidatePages } from '../hooks/revalidate'

/**
 * Photos uploaded in the admin panel. Every upload is also saved as a
 * compressed WebP copy sized for cards, so pages stay fast.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo', plural: 'Photos' },
  admin: { group: 'Content' },
  hooks: revalidatePages(['case-studies', 'products']),
  access: {
    read: anyone,
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  fields: [
    {
      name: 'alt',
      label: 'Description (for screen readers and Google)',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    formatOptions: { format: 'webp', options: { quality: 80 } },
    resizeOptions: { width: 2000, withoutEnlargement: true },
    imageSizes: [
      {
        name: 'card',
        width: 1200,
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 78 } },
      },
    ],
    adminThumbnail: 'card',
    focalPoint: true,
  },
}
