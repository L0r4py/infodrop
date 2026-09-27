-- Infodrop Pyrénées : taxonomie territoriale, observabilité et statistiques de sources H24.
-- Migration sans suppression de données.

alter table public.regional_source_checks
  add column if not exists items_fetched integer not null default 0,
  add column if not exists items_in_24h integer not null default 0,
  add column if not exists items_rejected_territory integer not null default 0,
  add column if not exists items_rejected_invalid_date integer not null default 0,
  add column if not exists items_duplicate integer not null default 0,
  add column if not exists items_written integer not null default 0,
  add column if not exists last_feed_item_at timestamptz,
  add column if not exists last_qualified_item_at timestamptz;

alter table public.regional_sources
  drop constraint if exists regional_sources_zone_check;

alter table public.regional_sources
  add constraint regional_sources_zone_check
  check (
    default_zone is null or default_zone in (
      'barousse', 'comminges', 'luchonnais', 'nestes_lannemezan',
      'hautes_pyrenees', 'haute_garonne_sud', 'val_aran', 'occitanie',
      'core', 'functional_ring', 'cross_border'
    )
  );

alter table public.actu
  drop constraint if exists actu_territory_zone_check;

alter table public.actu
  add constraint actu_territory_zone_check
  check (
    territory_zone is null or territory_zone in (
      'barousse', 'comminges', 'luchonnais', 'nestes_lannemezan',
      'hautes_pyrenees', 'haute_garonne_sud', 'val_aran', 'occitanie',
      'core', 'functional_ring', 'cross_border'
    )
  );

create or replace function public.get_edition_stats(p_edition_slug text default 'national')
returns jsonb
language sql
stable
security invoker
set search_path = public
as $function$
  with scoped_articles as (
    select source, orientation, tags, territory_zone
    from public.actu
    where heure >= now() - interval '24 hours'
      and edition_slug = p_edition_slug
  ),
  scoped_orientations as (
    select distinct orientation
    from scoped_articles
    where orientation is not null and btrim(orientation) <> ''
  ),
  scoped_tags as (
    select distinct tag
    from scoped_articles
    cross join lateral unnest(coalesce(tags, array[]::text[])) as tag
    where btrim(tag) <> ''
  ),
  scoped_zones as (
    select distinct territory_zone
    from scoped_articles
    where territory_zone is not null and btrim(territory_zone) <> ''
  )
  select jsonb_build_object(
    'total_articles', (select count(*) from scoped_articles),
    'total_sources', (select count(distinct source) from scoped_articles),
    'active_orientations', coalesce(
      (select jsonb_agg(orientation order by orientation) from scoped_orientations),
      '[]'::jsonb
    ),
    'active_tags', coalesce(
      (select jsonb_agg(tag order by tag) from scoped_tags),
      '[]'::jsonb
    ),
    'active_zones', coalesce(
      (select jsonb_agg(territory_zone order by territory_zone) from scoped_zones),
      '[]'::jsonb
    )
  );
$function$;

create or replace function public.get_edition_source_stats(p_edition_slug text default 'national')
returns jsonb
language sql
stable
security invoker
set search_path = public
as $function$
  with scoped as (
    select source, url, heure
    from public.actu
    where heure >= now() - interval '24 hours'
      and edition_slug = p_edition_slug
      and source is not null
      and btrim(source) <> ''
  ),
  grouped as (
    select
      source,
      count(*)::integer as article_count,
      (array_agg(url order by heure desc))[1] as latest_url
    from scoped
    group by source
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'source', source,
        'count', article_count,
        'url', latest_url
      )
      order by article_count desc, source
    ),
    '[]'::jsonb
  )
  from grouped;
$function$;

grant execute on function public.get_edition_source_stats(text) to anon, authenticated;

comment on function public.get_edition_source_stats(text) is
  'Sources réellement actives et volumes observés dans les dernières 24 heures pour une édition.';

comment on column public.regional_source_checks.items_fetched is
  'Nombre brut d items exposés par le flux lors de la collecte.';

comment on column public.regional_source_checks.items_rejected_territory is
  'Nombre d items H24 rejetés par la qualification territoriale.';
