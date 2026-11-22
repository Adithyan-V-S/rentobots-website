import type { CollectionConfig } from 'payload'

import { adminsOnly } from '../access'
import { revalidatePages } from '../hooks/revalidate'

/** The program detail pages that exist today (a new one needs a new page built). */
export const PROGRAM_PAGES = [
  { label: 'Campus Experience', value: 'programs-campus-experience' },
  { label: 'Humanoid Robotics Immersion', value: 'programs-humanoid-immersion' },
  { label: 'Humanoid Developer Workshop', value: 'programs-developer-workshop' },
  { label: 'Semester Development Program', value: 'programs-semester' },
  { label: 'Robotics Lab Partner', value: 'programs-lab-partner' },
] as const

/** Programs for institutions, listed on /programs. */
export const Programs: CollectionConfig = {
  slug: 'programs',
  labels: { singular: 'Program', plural: 'Programs' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'stage', 'duration', 'group', 'sortOrder', 'published'],
    group: 'Content',
  },
  access: {
    read: ({ req }) => (req.user ? true : { published: { equals: true } }),
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: 'sortOrder',
  hooks: revalidatePages(['programs']),
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'stage', type: 'text', admin: { description: 'Small label under the number, e.g. "Introduce"' } },
      ],
    },
    { name: 'summary', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        { name: 'duration', type: 'text', admin: { description: 'e.g. 1 day' } },
        { name: 'group', label: 'Group size', type: 'text', admin: { description: 'e.g. 40–100 students' } },
      ],
    },
    { name: 'detailPage', label: 'Program page', type: 'select', options: [...PROGRAM_PAGES] },
    {
      name: 'highlight',
      label: 'Highlight this program',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Shows it with a white border and the badge below.' },
    },
    { name: 'badge', type: 'text', admin: { position: 'sidebar', description: 'e.g. "Recommended start". Leave empty for none.' } },
    { name: 'published', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'sortOrder', label: 'Order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}
