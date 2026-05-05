create extension if not exists "pg_trgm" with schema "public";


  create table "public"."owners" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "phone" text not null,
    "email" text,
    "archived_at" timestamp with time zone,
    "archive_reason" text,
    "archive_reason_detail" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."owners" enable row level security;


  create table "public"."pets" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "name" text not null,
    "species" text not null,
    "breed" text,
    "birth_date" date,
    "estimated_age_value" numeric(5,1),
    "estimated_age_unit" text,
    "archived_at" timestamp with time zone,
    "archive_reason" text,
    "archive_reason_detail" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."pets" enable row level security;


  create table "public"."visit_medications" (
    "id" uuid not null default gen_random_uuid(),
    "visit_id" uuid not null,
    "name" text not null,
    "instructions" text,
    "duration" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."visit_medications" enable row level security;


  create table "public"."visits" (
    "id" uuid not null default gen_random_uuid(),
    "pet_id" uuid not null,
    "visit_date" date not null default CURRENT_DATE,
    "reason" text,
    "observations" text,
    "archived_at" timestamp with time zone,
    "archive_reason" text,
    "archive_reason_detail" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."visits" enable row level security;

CREATE INDEX owners_active_idx ON public.owners USING btree (archived_at) WHERE (archived_at IS NULL);

CREATE INDEX owners_name_trgm_idx ON public.owners USING gin (name public.gin_trgm_ops);

CREATE INDEX owners_phone_idx ON public.owners USING btree (phone);

CREATE UNIQUE INDEX owners_pkey ON public.owners USING btree (id);

CREATE INDEX pets_active_idx ON public.pets USING btree (archived_at) WHERE (archived_at IS NULL);

CREATE INDEX pets_breed_idx ON public.pets USING btree (breed);

CREATE INDEX pets_name_trgm_idx ON public.pets USING gin (name public.gin_trgm_ops);

CREATE INDEX pets_owner_id_idx ON public.pets USING btree (owner_id);

CREATE UNIQUE INDEX pets_pkey ON public.pets USING btree (id);

CREATE INDEX pets_species_idx ON public.pets USING btree (species);

CREATE UNIQUE INDEX visit_medications_pkey ON public.visit_medications USING btree (id);

CREATE INDEX visit_medications_visit_id_idx ON public.visit_medications USING btree (visit_id);

CREATE INDEX visits_active_idx ON public.visits USING btree (archived_at) WHERE (archived_at IS NULL);

CREATE INDEX visits_pet_id_visit_date_idx ON public.visits USING btree (pet_id, visit_date DESC);

CREATE UNIQUE INDEX visits_pkey ON public.visits USING btree (id);

alter table "public"."owners" add constraint "owners_pkey" PRIMARY KEY using index "owners_pkey";

alter table "public"."pets" add constraint "pets_pkey" PRIMARY KEY using index "pets_pkey";

alter table "public"."visit_medications" add constraint "visit_medications_pkey" PRIMARY KEY using index "visit_medications_pkey";

alter table "public"."visits" add constraint "visits_pkey" PRIMARY KEY using index "visits_pkey";

alter table "public"."owners" add constraint "owners_archive_consistency_check" CHECK ((((archived_at IS NULL) AND (archive_reason IS NULL) AND (archive_reason_detail IS NULL)) OR ((archived_at IS NOT NULL) AND (archive_reason IS NOT NULL)))) not valid;

alter table "public"."owners" validate constraint "owners_archive_consistency_check";

alter table "public"."owners" add constraint "owners_archive_detail_check" CHECK (((archive_reason IS DISTINCT FROM 'other'::text) OR (length(TRIM(BOTH FROM COALESCE(archive_reason_detail, ''::text))) > 0))) not valid;

alter table "public"."owners" validate constraint "owners_archive_detail_check";

alter table "public"."owners" add constraint "owners_archive_reason_check" CHECK (((archive_reason IS NULL) OR (archive_reason = ANY (ARRAY['duplicate_record'::text, 'data_entry_error'::text, 'inactive_patient'::text, 'other'::text])))) not valid;

alter table "public"."owners" validate constraint "owners_archive_reason_check";

alter table "public"."owners" add constraint "owners_name_not_blank" CHECK ((length(TRIM(BOTH FROM name)) > 0)) not valid;

alter table "public"."owners" validate constraint "owners_name_not_blank";

alter table "public"."owners" add constraint "owners_phone_not_blank" CHECK ((length(TRIM(BOTH FROM phone)) > 0)) not valid;

alter table "public"."owners" validate constraint "owners_phone_not_blank";

alter table "public"."pets" add constraint "pets_archive_consistency_check" CHECK ((((archived_at IS NULL) AND (archive_reason IS NULL) AND (archive_reason_detail IS NULL)) OR ((archived_at IS NOT NULL) AND (archive_reason IS NOT NULL)))) not valid;

alter table "public"."pets" validate constraint "pets_archive_consistency_check";

alter table "public"."pets" add constraint "pets_archive_detail_check" CHECK (((archive_reason IS DISTINCT FROM 'other'::text) OR (length(TRIM(BOTH FROM COALESCE(archive_reason_detail, ''::text))) > 0))) not valid;

alter table "public"."pets" validate constraint "pets_archive_detail_check";

alter table "public"."pets" add constraint "pets_archive_reason_check" CHECK (((archive_reason IS NULL) OR (archive_reason = ANY (ARRAY['duplicate_record'::text, 'data_entry_error'::text, 'inactive_patient'::text, 'other'::text])))) not valid;

alter table "public"."pets" validate constraint "pets_archive_reason_check";

alter table "public"."pets" add constraint "pets_birth_date_not_future" CHECK (((birth_date IS NULL) OR (birth_date <= CURRENT_DATE))) not valid;

alter table "public"."pets" validate constraint "pets_birth_date_not_future";

alter table "public"."pets" add constraint "pets_estimated_age_consistency_check" CHECK ((((estimated_age_value IS NULL) AND (estimated_age_unit IS NULL)) OR ((estimated_age_value IS NOT NULL) AND (estimated_age_unit IS NOT NULL)))) not valid;

alter table "public"."pets" validate constraint "pets_estimated_age_consistency_check";

alter table "public"."pets" add constraint "pets_estimated_age_positive" CHECK (((estimated_age_value IS NULL) OR (estimated_age_value > (0)::numeric))) not valid;

alter table "public"."pets" validate constraint "pets_estimated_age_positive";

alter table "public"."pets" add constraint "pets_estimated_age_unit_check" CHECK (((estimated_age_unit IS NULL) OR (estimated_age_unit = ANY (ARRAY['weeks'::text, 'months'::text, 'years'::text])))) not valid;

alter table "public"."pets" validate constraint "pets_estimated_age_unit_check";

alter table "public"."pets" add constraint "pets_name_not_blank" CHECK ((length(TRIM(BOTH FROM name)) > 0)) not valid;

alter table "public"."pets" validate constraint "pets_name_not_blank";

alter table "public"."pets" add constraint "pets_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.owners(id) ON DELETE RESTRICT not valid;

alter table "public"."pets" validate constraint "pets_owner_id_fkey";

alter table "public"."pets" add constraint "pets_species_not_blank" CHECK ((length(TRIM(BOTH FROM species)) > 0)) not valid;

alter table "public"."pets" validate constraint "pets_species_not_blank";

alter table "public"."visit_medications" add constraint "visit_medications_name_not_blank" CHECK ((length(TRIM(BOTH FROM name)) > 0)) not valid;

alter table "public"."visit_medications" validate constraint "visit_medications_name_not_blank";

alter table "public"."visit_medications" add constraint "visit_medications_visit_id_fkey" FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE not valid;

alter table "public"."visit_medications" validate constraint "visit_medications_visit_id_fkey";

alter table "public"."visits" add constraint "visits_archive_consistency_check" CHECK ((((archived_at IS NULL) AND (archive_reason IS NULL) AND (archive_reason_detail IS NULL)) OR ((archived_at IS NOT NULL) AND (archive_reason IS NOT NULL)))) not valid;

alter table "public"."visits" validate constraint "visits_archive_consistency_check";

alter table "public"."visits" add constraint "visits_archive_detail_check" CHECK (((archive_reason IS DISTINCT FROM 'other'::text) OR (length(TRIM(BOTH FROM COALESCE(archive_reason_detail, ''::text))) > 0))) not valid;

alter table "public"."visits" validate constraint "visits_archive_detail_check";

alter table "public"."visits" add constraint "visits_archive_reason_check" CHECK (((archive_reason IS NULL) OR (archive_reason = ANY (ARRAY['duplicate_record'::text, 'data_entry_error'::text, 'inactive_patient'::text, 'other'::text])))) not valid;

alter table "public"."visits" validate constraint "visits_archive_reason_check";

alter table "public"."visits" add constraint "visits_pet_id_fkey" FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE RESTRICT not valid;

alter table "public"."visits" validate constraint "visits_pet_id_fkey";

alter table "public"."visits" add constraint "visits_reason_or_observations_check" CHECK (((length(TRIM(BOTH FROM COALESCE(reason, ''::text))) > 0) OR (length(TRIM(BOTH FROM COALESCE(observations, ''::text))) > 0))) not valid;

alter table "public"."visits" validate constraint "visits_reason_or_observations_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."owners" to "anon";

grant insert on table "public"."owners" to "anon";

grant references on table "public"."owners" to "anon";

grant select on table "public"."owners" to "anon";

grant trigger on table "public"."owners" to "anon";

grant truncate on table "public"."owners" to "anon";

grant update on table "public"."owners" to "anon";

grant delete on table "public"."owners" to "authenticated";

grant insert on table "public"."owners" to "authenticated";

grant references on table "public"."owners" to "authenticated";

grant select on table "public"."owners" to "authenticated";

grant trigger on table "public"."owners" to "authenticated";

grant truncate on table "public"."owners" to "authenticated";

grant update on table "public"."owners" to "authenticated";

grant delete on table "public"."owners" to "service_role";

grant insert on table "public"."owners" to "service_role";

grant references on table "public"."owners" to "service_role";

grant select on table "public"."owners" to "service_role";

grant trigger on table "public"."owners" to "service_role";

grant truncate on table "public"."owners" to "service_role";

grant update on table "public"."owners" to "service_role";

grant delete on table "public"."pets" to "anon";

grant insert on table "public"."pets" to "anon";

grant references on table "public"."pets" to "anon";

grant select on table "public"."pets" to "anon";

grant trigger on table "public"."pets" to "anon";

grant truncate on table "public"."pets" to "anon";

grant update on table "public"."pets" to "anon";

grant delete on table "public"."pets" to "authenticated";

grant insert on table "public"."pets" to "authenticated";

grant references on table "public"."pets" to "authenticated";

grant select on table "public"."pets" to "authenticated";

grant trigger on table "public"."pets" to "authenticated";

grant truncate on table "public"."pets" to "authenticated";

grant update on table "public"."pets" to "authenticated";

grant delete on table "public"."pets" to "service_role";

grant insert on table "public"."pets" to "service_role";

grant references on table "public"."pets" to "service_role";

grant select on table "public"."pets" to "service_role";

grant trigger on table "public"."pets" to "service_role";

grant truncate on table "public"."pets" to "service_role";

grant update on table "public"."pets" to "service_role";

grant delete on table "public"."visit_medications" to "anon";

grant insert on table "public"."visit_medications" to "anon";

grant references on table "public"."visit_medications" to "anon";

grant select on table "public"."visit_medications" to "anon";

grant trigger on table "public"."visit_medications" to "anon";

grant truncate on table "public"."visit_medications" to "anon";

grant update on table "public"."visit_medications" to "anon";

grant delete on table "public"."visit_medications" to "authenticated";

grant insert on table "public"."visit_medications" to "authenticated";

grant references on table "public"."visit_medications" to "authenticated";

grant select on table "public"."visit_medications" to "authenticated";

grant trigger on table "public"."visit_medications" to "authenticated";

grant truncate on table "public"."visit_medications" to "authenticated";

grant update on table "public"."visit_medications" to "authenticated";

grant delete on table "public"."visit_medications" to "service_role";

grant insert on table "public"."visit_medications" to "service_role";

grant references on table "public"."visit_medications" to "service_role";

grant select on table "public"."visit_medications" to "service_role";

grant trigger on table "public"."visit_medications" to "service_role";

grant truncate on table "public"."visit_medications" to "service_role";

grant update on table "public"."visit_medications" to "service_role";

grant delete on table "public"."visits" to "anon";

grant insert on table "public"."visits" to "anon";

grant references on table "public"."visits" to "anon";

grant select on table "public"."visits" to "anon";

grant trigger on table "public"."visits" to "anon";

grant truncate on table "public"."visits" to "anon";

grant update on table "public"."visits" to "anon";

grant delete on table "public"."visits" to "authenticated";

grant insert on table "public"."visits" to "authenticated";

grant references on table "public"."visits" to "authenticated";

grant select on table "public"."visits" to "authenticated";

grant trigger on table "public"."visits" to "authenticated";

grant truncate on table "public"."visits" to "authenticated";

grant update on table "public"."visits" to "authenticated";

grant delete on table "public"."visits" to "service_role";

grant insert on table "public"."visits" to "service_role";

grant references on table "public"."visits" to "service_role";

grant select on table "public"."visits" to "service_role";

grant trigger on table "public"."visits" to "service_role";

grant truncate on table "public"."visits" to "service_role";

grant update on table "public"."visits" to "service_role";


  create policy "authenticated staff can manage owners"
  on "public"."owners"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "authenticated staff can manage pets"
  on "public"."pets"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "authenticated staff can manage visit medications"
  on "public"."visit_medications"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "authenticated staff can manage visits"
  on "public"."visits"
  as permissive
  for all
  to authenticated
using (true)
with check (true);


CREATE TRIGGER owners_set_updated_at BEFORE UPDATE ON public.owners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER pets_set_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER visit_medications_set_updated_at BEFORE UPDATE ON public.visit_medications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER visits_set_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


