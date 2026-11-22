import type { CollectionConfig } from 'payload'

import { adminsOnly, anyone } from '../access'
import { revalidatePages } from '../hooks/revalidate'

export const PRODUCT_CATEGORIES = [
  { label: 'Humanoid', value: 'humanoid' },
  { label: 'Quadruped', value: 'quadruped' },
  { label: 'Cobot', value: 'cobot' },
] as const

/** Robots we sell, shown on /products. */
export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'published', 'sortOrder'],
    group: 'Content',
  },
  access: {
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: 'sortOrder',
  hooks: revalidatePages(['products']),
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. Unitree G1 EDU U8' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Short id for links, e.g. "g1-edu-u8". Lowercase, no spaces.' },
    },
    { name: 'category', type: 'select', required: true, options: [...PRODUCT_CATEGORIES] },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'specs',
      label: 'Key specs (small tags)',
      type: 'array',
      maxRows: 6,
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'sortOrder',
      label: 'Order',
      type: 'number',
      defaultValue: 100,
      admin: { position: 'sidebar', description: 'Lower numbers show first.' },
    },
  ],
}
