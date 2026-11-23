import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "robots" ADD COLUMN "details_link" varchar;
  ALTER TABLE "robots" ADD COLUMN "details_label" varchar DEFAULT 'View details';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "robots" DROP COLUMN "details_link";
  ALTER TABLE "robots" DROP COLUMN "details_label";`)
}
