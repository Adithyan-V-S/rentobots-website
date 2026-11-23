import type { CheckboxField } from 'payload'

/**
 * "Shown on website" switch. In admin lists it appears as a one-click
 * Show / Hide button (components/admin/PublishedToggleCell).
 */
export const publishedField: CheckboxField = {
  name: 'published',
  label: 'Shown on website',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    position: 'sidebar',
    description: 'Untick to hide it from the website without deleting it.',
    components: { Cell: '/components/admin/PublishedToggleCell' },
  },
}
