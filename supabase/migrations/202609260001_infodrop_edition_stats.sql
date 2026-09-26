-- Statistiques publiques séparées par édition.
-- Migration additive : la fonction historique get_live_stats reste inchangée.

create or replace function public.get_edition_stats(p_edition_slug text default 'national')
returns jsonb
language sql
stable
security invoker
set search_path = public
as $function$
  with scoped_articles as (
    select source, orientation, tags
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
    )
  );
$function$;

grant execute on function public.get_edition_stats(text) to anon, authenticated;

comment on function public.get_edition_stats(text) is
  'Statistiques des dernières 24 heures limitées à une édition Infodrop.';
