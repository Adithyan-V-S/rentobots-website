import type { Access } from 'payload'

/** Only logged-in admin users. There is no public sign-up. */
export const adminsOnly: Access = ({ req }) => Boolean(req.user)

/** Anyone may read (used for published site content). */
export const anyone: Access = () => true
