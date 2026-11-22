import type { CollectionConfig } from 'payload'

import { adminsOnly } from '../access'

/**
 * Admin accounts. Only an existing admin can create another one;
 * visitors can never sign up.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Admin', plural: 'Admins' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email'],
    group: 'Settings',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 8,
  },
  access: {
    create: adminsOnly,
    read: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  fields: [{ name: 'name', type: 'text' }],
}
