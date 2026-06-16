alter table "public"."owners"
  alter column "name" drop not null,
  alter column "phone" drop not null,
  add column if not exists "address" text;

alter table "public"."pets"
  alter column "species" drop not null,
  add column if not exists "is_sterilized" boolean;
