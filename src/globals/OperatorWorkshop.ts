import type { GlobalConfig } from 'payload'

import { adminsOnly } from '../access'

/** The Certified Robot Operator workshop box on /programs. */
export const OperatorWorkshop: GlobalConfig = {
  slug: 'operator-workshop',
  label: 'Operator workshop',
  admin: { group: 'Content' },
  access: { read: () => true, update: adminsOnly },
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (!req.context?.disableRevalidate) {
          try {
            const { revalidateTag } = await import('next/cache')
            revalidateTag('page:programs', { expire: 0 })
          } catch {}
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'format', type: 'text', defaultValue: '3 days, hands-on' },
    { name: 'seats', label: 'Seats per batch', type: 'number', defaultValue: 15 },
    { name: 'nextBatch', label: 'Next batch', type: 'text', defaultValue: 'Not confirmed', admin: { description: 'e.g. "Kochi · 12–14 Jan 2027" or "Not confirmed"' } },
  ],
}
