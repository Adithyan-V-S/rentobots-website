import type { CollectionConfig } from 'payload'

import { adminsOnly, anyone } from '../access'
import { revalidatePages } from '../hooks/revalidate'

/**
 * Our own robots for hire (Pachu, Kuttappan, D1, ...).
 * Shown on /robot-models and used as tags on case studies.
 */
export const Robots: CollectionConfig = {
  slug: 'robots',
  labels: { singular: 'Robot model', plural: 'Robot models' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind', 'model', 'showOnModelsPage', 'sortOrder'],
    group: 'Content',
  },
  access: { read: anyone, create: adminsOnly, update: adminsOnly, delete: adminsOnly },
  defaultSort: 'sortOrder',
  hooks: revalidatePages(['ALL']),
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'e.g. Pachu' } },
        { name: 'kind', label: 'Type', type: 'text', required: true, admin: { description: 'e.g. Humanoid or Robot dog' } },
        { name: 'model', label: 'Hardware model', type: 'text', admin: { description: 'e.g. Unitree G1 EDU' } },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Link id on /robot-models, e.g. "pachu" → /robot-models#pachu' },
    },
    { name: 'photo', type: 'upload', relationTo: 'media', admin: { description: 'Tall photo works best. Set the focal point to control the crop.' } },
    { name: 'description', type: 'textarea' },
    {
      name: 'capabilities',
      label: 'What it does',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'greatFor', label: 'Great for', type: 'text', admin: { description: 'e.g. product launches, weddings and college tech fests.' } },
    { name: 'bestMoment', label: 'Best moment (comparison table)', type: 'text' },
    { name: 'isNew', label: 'Show "New" badge', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'showOnModelsPage', label: 'Show on Robot models page', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'bookable',
      label: 'Show on Hire page (bookable)',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Visitors can pick this robot in the booking form. The first one is pre-selected.' },
    },
    { name: 'sortOrder', label: 'Order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}
