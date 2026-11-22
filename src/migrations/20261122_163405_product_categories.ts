import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_products_category" ADD VALUE 'cleaning';
  ALTER TYPE "public"."enum_products_category" ADD VALUE 'delivery';
  ALTER TYPE "public"."enum_products_category" ADD VALUE 'lawn';
  ALTER TYPE "public"."enum_products_category" ADD VALUE 'companion';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_products_category";
  CREATE TYPE "public"."enum_products_category" AS ENUM('humanoid', 'quadruped', 'cobot');
  ALTER TABLE "products" ALTER COLUMN "category" SET DATA TYPE "public"."enum_products_category" USING "category"::"public"."enum_products_category";`)
}
