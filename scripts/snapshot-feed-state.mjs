import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
const output = process.argv[2];
if (!output) throw Error('Chemin du rapport requis');
const cfg = await (await fetch('https://www.infodrop.live/api/config')).json();
const db = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
const report = { checked_at: new Date().toISOString(), editions: {} };
for (const edition of ['national', 'pyrenees']) {
  const { data: stats, error } = await db.rpc('get_edition_stats', { p_edition_slug: edition });
  if (error) throw error;
  const { data: sources, error: sourceError } = await db.rpc('get_edition_source_stats', { p_edition_slug: edition });
  if (sourceError) throw sourceError;
  report.editions[edition] = { stats, sources };
}
const { data: articles, error } = await db.from('actu').select('id,source,source_slug,territory_zone,heure,url')
  .eq('edition_slug','pyrenees').gte('heure',new Date(Date.now()-86400000).toISOString()).order('heure',{ascending:false}).limit(1000);
if (error) throw error;
report.editions.pyrenees.zones = {};
for (const a of articles) report.editions.pyrenees.zones[a.territory_zone] = (report.editions.pyrenees.zones[a.territory_zone] || 0) + 1;
report.editions.pyrenees.articles = articles;
const { data: diagnostics, error: diagnosticError } = await db.from('regional_sources')
  .select('slug,active,default_zone,latest:regional_source_checks(checked_at,status,items_in_24h,items_rejected_invalid_date,items_duplicate,items_written,last_feed_item_at,last_qualified_item_at)')
  .order('checked_at',{referencedTable:'latest',ascending:false}).limit(1,{referencedTable:'latest'});
if (diagnosticError) throw diagnosticError;
report.diagnostics = diagnostics;
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checked_at:report.checked_at,national:report.editions.national.stats,pyrenees:report.editions.pyrenees.stats,zones:report.editions.pyrenees.zones}));
