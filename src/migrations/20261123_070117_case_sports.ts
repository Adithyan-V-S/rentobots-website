import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_case_studies_category" ADD VALUE 'sports';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_case_studies_category";
  CREATE TYPE "public"."enum_case_studies_category" AS ENUM('retail', 'corporate', 'celebrations', 'education');
  ALTER TABLE "case_studies" ALTER COLUMN "category" SET DATA TYPE "public"."enum_case_studies_category" USING "category"::"public"."enum_case_studies_category";`)
}
