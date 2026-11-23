import type { CollectionConfig } from 'payload'

import { adminsOnly } from '../access'
import { revalidatePages } from '../hooks/revalidate'
import { publishedField } from '../fields/published'

/** Pages that have an FAQ section. Value = page file name in /site. */
export const FAQ_PAGES = [
  { label: 'Home', value: 'index' },
  { label: 'Hire a robot', value: 'hire' },
  { label: 'Programs', value: 'programs' },
  { label: 'Partner with us', value: 'partner' },
  { label: 'China tour', value: 'china-tour' },
] as const

export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'pages', 'sortOrder', 'published'],
    group: 'Content',
    description: 'One question can appear on several pages. Order: lower numbers show first.',
  },
  access: {
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: 'sortOrder',
  hooks: revalidatePages(FAQ_PAGES.map((p) => p.value)),
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'textarea', required: true },
    {
      name: 'pages',
      label: 'Show on pages',
      type: 'select',
      hasMany: true,
      required: true,
      options: [...FAQ_PAGES],
    },
    publishedField,
    { name: 'sortOrder', label: 'Order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}
