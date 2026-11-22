import type { CollectionConfig } from 'payload'

import { adminsOnly, anyone } from '../access'
import { revalidatePages } from '../hooks/revalidate'

export const CASE_CATEGORIES = [
  { label: 'Malls & retail', value: 'retail' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Celebrations', value: 'celebrations' },
  { label: 'Education', value: 'education' },
] as const

/** Case studies shown on /case-studies. Empty fields are simply hidden on the site. */
export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case study', plural: 'Case studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'place', 'featured', 'published'],
    group: 'Content',
  },
  access: {
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: 'sortOrder',
  hooks: revalidatePages(['case-studies']),
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Short id used in the page link, e.g. "wedding" → /case-studies#cs-wedding. Lowercase, no spaces.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'select', required: true, options: [...CASE_CATEGORIES] },
        { name: 'place', label: 'City / venue', type: 'text', admin: { description: 'Leave empty to hide.' } },
      ],
    },
    { name: 'robots', type: 'relationship', relationTo: 'robots', hasMany: true },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Landscape photo. Set the focal point on the photo to control the crop. Leave empty for a placeholder box.' },
    },
    { name: 'summary', label: 'Short summary (shown on the card)', type: 'textarea', required: true },
    { name: 'brief', label: 'The brief', type: 'textarea' },
    { name: 'whatWeDid', label: 'What we did', type: 'textarea' },
    { name: 'result', label: 'The result', type: 'textarea', admin: { description: 'Leave empty to hide this section.' } },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show as the big story at the top of the page (only the first featured one is used).' },
    },
    {
      type: 'collapsible',
      label: 'Featured story text (optional)',
      admin: { initCollapsed: true, condition: (data) => Boolean(data?.featured) },
      fields: [
        { name: 'featuredLabel', label: 'Label', type: 'text', admin: { description: 'e.g. "Malls & retail · Festive". Defaults to the category.' } },
        { name: 'featuredText', label: 'Longer intro', type: 'textarea', admin: { description: 'Defaults to the short summary.' } },
      ],
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
