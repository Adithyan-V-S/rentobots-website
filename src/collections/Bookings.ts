import type { CollectionConfig } from 'payload'

import { adminsOnly } from '../access'

/**
 * Booking requests from the "Hire a robot" page. The site saves one here
 * every time a visitor sends their booking on WhatsApp. Visitors can only
 * create; only admins can view or change them.
 */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Booking', plural: 'Bookings' },
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['status', 'name', 'phone', 'robots', 'event', 'eventDate', 'city', 'createdAt'],
    group: 'Bookings',
    listSearchableFields: ['name', 'phone', 'city', 'venue', 'notes'],
  },
  access: {
    create: () => true,
    read: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  defaultSort: '-createdAt',
  hooks: {
    beforeChange: [
      ({ data, operation, req }) => {
        // Visitors cannot set the status or internal notes themselves.
        if (operation === 'create' && !req.user) {
          data.status = 'new'
          data.internalNotes = undefined
        }
        const bits = [data.name || 'Unnamed', data.event, data.eventDate].filter(Boolean)
        data.summary = bits.join(' · ')
        return data
      },
    ],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      required: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Done', value: 'done' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'internalNotes', label: 'Team notes (private)', type: 'textarea', admin: { position: 'sidebar' } },
    { name: 'summary', type: 'text', admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', maxLength: 120 },
        { name: 'phone', type: 'text', maxLength: 30 },
        { name: 'robots', type: 'text', maxLength: 200 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'event', label: 'Event type', type: 'text', maxLength: 120 },
        { name: 'eventDate', label: 'Event date', type: 'text', maxLength: 40 },
        { name: 'hours', label: 'Time on site', type: 'text', maxLength: 80 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'city', type: 'text', maxLength: 120 },
        { name: 'venue', type: 'text', maxLength: 200 },
        { name: 'guests', type: 'text', maxLength: 40 },
      ],
    },
    { name: 'moments', label: 'Robot moments', type: 'text', maxLength: 400 },
    { name: 'notes', label: 'Customer notes', type: 'textarea', maxLength: 2000 },
  ],
}
