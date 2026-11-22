import type { CollectionConfig } from 'payload'

import { adminsOnly, anyone } from '../access'
import { revalidatePages } from '../hooks/revalidate'

/** Our own robots (Pachu, Kuttappan, ...). Case studies pick from this list. */
export const Robots: CollectionConfig = {
  slug: 'robots',
  labels: { singular: 'Robot', plural: 'Robots' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'kind'],
    group: 'Content',
  },
  access: { read: anyone, create: adminsOnly, update: adminsOnly, delete: adminsOnly },
  hooks: revalidatePages(['case-studies']),
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. Pachu' } },
    { name: 'kind', label: 'Type', type: 'text', required: true, admin: { description: 'e.g. Humanoid or Robot dog' } },
  ],
}
