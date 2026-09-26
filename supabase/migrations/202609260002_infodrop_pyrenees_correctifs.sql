-- Correctifs Infodrop Pyrénées du 26 septembre 2026.
-- Migration additive : zones publiques, politiques de filtrage et diagnostic par source.

alter table public.regional_sources
  add column if not exists default_display_zone text,
  add column if not exists territory_policy text not null default 'regional_strict',
  add column if not exists dedupe_priority integer not null default 0,
  add column if not exists last_items_fetched integer not null default 0,
  add column if not exists last_items_in_24h integer not null default 0,
  add column if not exists last_items_rejected_territory integer not null default 0,
  add column if not exists last_items_rejected_invalid_date integer not null default 0,
  add column if not exists last_items_duplicate integer not null default 0,
  add column if not exists last_items_written integer not null default 0,
  add column if not exists last_feed_item_at timestamptz,
  add column if not exists last_qualified_item_at timestamptz;

alter table public.regional_source_checks
  add column if not exists items_fetched integer not null default 0,
  add column if not exists items_in_24h integer not null default 0,
  add column if not exists items_rejected_territory integer not null default 0,
  add column if not exists items_rejected_invalid_date integer not null default 0,
  add column if not exists items_rejected_invalid_url integer not null default 0,
  add column if not exists items_duplicate integer not null default 0,
  add column if not exists items_written integer not null default 0,
  add column if not exists last_feed_item_at timestamptz,
  add column if not exists last_qualified_item_at timestamptz;

alter table public.actu
  add column if not exists display_zone text,
  add column if not exists relevance_level text;

update public.actu
set display_zone = case
  when lower(coalesce(locality, '')) like '%barousse%' then 'barousse'
  when lower(coalesce(locality, '')) like '%luchon%' then 'luchonnais'
  when lower(coalesce(locality, '')) like '%lannemezan%'
    or lower(coalesce(locality, '')) like '%neste%' then 'nestes_lannemezan'
  when lower(coalesce(locality, '')) like '%aran%' then 'val_aran'
  when lower(coalesce(locality, '')) like '%hautes-pyrénées%'
    or lower(coalesce(locality, '')) like '%hautes-pyrenees%' then 'hautes_pyrenees'
  when lower(coalesce(locality, '')) like '%comminges%'
    or lower(coalesce(locality, '')) like '%saint-gaudens%'
    or lower(coalesce(locality, '')) like '%montréjeau%' then 'comminges'
  else display_zone
end
where edition_slug = 'pyrenees'
  and display_zone is null;

update public.actu
set relevance_level = case
  when territory_zone = 'cross_border' then 'cross_border'
  when display_zone = 'hautes_pyrenees' then 'department'
  else 'core'
end
where edition_slug = 'pyrenees'
  and relevance_level is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'regional_sources_display_zone_check'
      and conrelid = 'public.regional_sources'::regclass
  ) then
    alter table public.regional_sources
      add constraint regional_sources_display_zone_check
      check (
        default_display_zone is null
        or default_display_zone in (
          'barousse', 'comminges', 'luchonnais', 'nestes_lannemezan',
          'hautes_pyrenees', 'val_aran'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'regional_sources_territory_policy_check'
      and conrelid = 'public.regional_sources'::regclass
  ) then
    alter table public.regional_sources
      add constraint regional_sources_territory_policy_check
      check (
        territory_policy in (
          'trusted_local', 'department_65', 'south_31', 'regional_strict',
          'pyrenees_strict', 'specialized_strict'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'actu_display_zone_check'
      and conrelid = 'public.actu'::regclass
  ) then
    alter table public.actu
      add constraint actu_display_zone_check
      check (
        display_zone is null
        or display_zone in (
          'barousse', 'comminges', 'luchonnais', 'nestes_lannemezan',
          'hautes_pyrenees', 'val_aran'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'actu_relevance_level_check'
      and conrelid = 'public.actu'::regclass
  ) then
    alter table public.actu
      add constraint actu_relevance_level_check
      check (
        relevance_level is null
        or relevance_level in ('core', 'department', 'cross_border', 'regional_relevant')
      );
  end if;
end $$;

create table if not exists public.regional_source_diagnostics (
  source_slug text primary key references public.regional_sources(slug)
    on update cascade on delete cascade,
  checked_at timestamptz not null,
  rejections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint regional_source_diagnostics_rejections_array_check
    check (jsonb_typeof(rejections) = 'array')
);

alter table public.regional_source_diagnostics enable row level security;
revoke all on table public.regional_source_diagnostics from anon, authenticated;
grant select, insert, update, delete on table public.regional_source_diagnostics to service_role;

create index if not exists idx_actu_pyrenees_display_zone_heure
  on public.actu (display_zone, heure desc)
  where edition_slug = 'pyrenees';

create index if not exists idx_regional_source_checks_checked_at
  on public.regional_source_checks (checked_at desc);

comment on column public.regional_sources.default_display_zone is
  'Zone géographique publique et sémantique utilisée par les badges Infodrop Pyrénées.';

comment on column public.regional_sources.territory_policy is
  'Politique source-aware : locale, département 65, sud 31 ou filtrage strict.';

comment on column public.actu.display_zone is
  'Zone publique : Barousse, Comminges, Luchonnais, Nestes/Lannemezan, Hautes-Pyrénées ou Val d Aran.';

comment on column public.actu.relevance_level is
  'Niveau de pertinence : core, department, cross_border ou regional_relevant.';

comment on table public.regional_source_diagnostics is
  'Dix derniers refus par source. Table privée, lisible uniquement avec la clé de service.';
