import { parseHTML } from 'linkedom';
import Parser from 'rss-parser';
import { readFile, writeFile } from 'node:fs/promises';

const groups = {
  comminges: ['Saint-Gaudens','Montréjeau','Barbazan','Gourdan-Polignan','Valentine','Villeneuve-de-Rivière','Estancarbon','Landorthe','Labarthe-Rivière','Labarthe-Inard','Pointis-Inard','Saint-Bertrand-de-Comminges','Aspet','Salies-du-Salat','Mane','Mazères-sur-Salat','Arbas','Sengouagnet','Saint-Martory','Boussens','Roquefort-sur-Garonne','Aurignac','Boulogne-sur-Gesse',"L’Isle-en-Dodon"],
  haute_garonne_sud: ['Cazères','Le Fousseret'],
  luchonnais: ['Bagnères-de-Luchon','Saint-Béat-Lez','Cierp-Gaud','Marignac','Fos','Melles','Boutx','Saint-Mamet','Saint-Aventin'],
  barousse: ['Loures-Barousse','Mauléon-Barousse','Sarp'],
  nestes_lannemezan: ['Saint-Laurent-de-Neste','La Barthe-de-Neste','Lannemezan','Capvern','Arreau','Saint-Lary-Soulan'],
  hautes_pyrenees: ['Tarbes','Lourdes','Bagnères-de-Bigorre','Argelès-Gazost','Cauterets','Luz-Saint-Sauveur'],
};
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'-').replace(/\s+/g,'-');
const parser = new Parser();
const get = url => fetch(url, {signal: AbortSignal.timeout(12000), headers:{'User-Agent':'Mozilla/5.0 (compatible; Infodrop/1.0; +https://infodrop.live/)'}});
const communes = (await Promise.all(['31','65'].map(async dep => (await get(`https://geo.api.gouv.fr/departements/${dep}/communes?fields=nom,code`)).json()))).flat();
const candidates = [];
for (const [zone,names] of Object.entries(groups)) for (const name of names) {
  const commune = communes.find(c=>norm(c.nom)===norm(name));
  candidates.push({slug:`depeche-${norm(name)}`,name:`La Dépêche — ${name}`,locality:name,zone,media:'La Dépêche',page:commune ? `https://www.ladepeche.fr/communes/${norm(commune.nom)},${commune.code}/`:null});
}
for (const [slug,media,page,zone,locality] of [
  ['semaine-hautes-pyrenees','La Semaine des Pyrénées','https://www.lasemainedespyrenees.fr/category/hautes-pyrenees/','hautes_pyrenees','Hautes-Pyrénées'],
  ['semaine-lannemezan','La Semaine des Pyrénées','https://www.lasemainedespyrenees.fr/category/communes/lannemezan-pays/','nestes_lannemezan','Lannemezan pays'],
  ['semaine-tarbes','La Semaine des Pyrénées','https://www.lasemainedespyrenees.fr/category/communes/tarbes-agglo/','hautes_pyrenees','Tarbes agglo'],
  ['semaine-lourdes','La Semaine des Pyrénées','https://www.lasemainedespyrenees.fr/category/communes/lourdes-et-gaves/','hautes_pyrenees','Lourdes et Gaves'],
  ['petite-republique-comminges','Petite République','https://www.petiterepublique.com/actualites/communautes-de-communes/cc-coeur-et-coteaux-du-comminges/','comminges','Cœur et Coteaux Comminges'],
  ['petite-republique-cagire','Petite République','https://www.petiterepublique.com/actualites/communautes-de-communes/cc-cagire-garonne-salat/','comminges','Cagire Garonne Salat'],
  ['petite-republique-pyrenees','Petite République','https://www.petiterepublique.com/actualites/communautes-de-communes/cc-pyrenees-haut-garonnaises/','luchonnais','Pyrénées Haut Garonnaises'],
  ['petite-republique-coeur-garonne','Petite République','https://www.petiterepublique.com/actualites/communautes-de-communes/cc-coeur-de-garonne/','haute_garonne_sud','Cœur de Garonne'],
]) candidates.push({slug,media,name:`${media} — ${locality}`,page,zone,locality});

async function inspect(c) {
  try {
    if(!c.page) throw Error('Commune non résolue');
    const r=await get(c.page); if(!r.ok) throw Error(`Page HTTP ${r.status}`);
    const {document}=parseHTML(await r.text());
    const links=[...document.querySelectorAll('link[rel="alternate"]')].filter(l=>/rss|atom/.test(l.getAttribute('type')||'')).map(l=>new URL(l.getAttribute('href'),r.url).href);
    c.feed_url=links.find(u=>(u.startsWith(c.page) || (c.slug === 'depeche-saint-beat-lez' && u.includes('/communes/saint-beat-lez/'))) && !/comments/.test(u));
    if(!c.feed_url) throw Error('Aucun RSS de rubrique déclaré');
    c.reads=[];
    for(let i=0;i<2;i++) {
      const fr=await get(c.feed_url); if(!fr.ok) throw Error(`RSS HTTP ${fr.status}`);
      const f=await parser.parseString(await fr.text());
      const items=f.items||[];
      const valid=items.filter(i=>i.title&&i.link&&Number.isFinite(new Date(i.isoDate||i.pubDate).getTime()));
      const newest=valid.map(i=>new Date(i.isoDate||i.pubDate)).sort((a,b)=>b-a)[0];
      const in24=valid.filter(i=>{const age=Date.now()-new Date(i.isoDate||i.pubDate);return age>=0&&age<=86400000;});
      c.reads.push({status:fr.status,title:f.title,count:items.length,valid:valid.length,h24:in24.length,newest:newest?.toISOString(),sample:items.slice(0,3).map(i=>({title:i.title,url:i.link,date:i.isoDate||i.pubDate}))});
      if(!items.length||valid.length!==items.length||!newest||Date.now()-newest>180*86400000||newest>Date.now()+300000) throw Error('Flux vide, périmé ou items sans date/titre/lien');
    }
    c.valid=true;
  }catch(e){c.valid=false;c.error=e.message;}
  console.log(JSON.stringify({slug:c.slug,valid:c.valid,h24:c.reads?.[1]?.h24,error:c.error,feed:c.feed_url}));
  return c;
}
const only = process.argv.filter(a=>a.startsWith('--source=')).map(a=>a.slice(9));
const selected = candidates.filter(c=>!only.length || only.includes(c.slug));
for (const c of selected) {
  if(c.slug === 'depeche-l-isle-en-dodon') c.page='https://www.ladepeche.fr/communes/lisle-en-dodon,31239/';
  if(c.slug === 'depeche-saint-beat-lez') c.page='https://www.ladepeche.fr/communes/saint-beat,31471/';
}
let cursor=0;const results=only.length ? JSON.parse(await readFile('docs/local-rubrics-audit-2026-09-27.json','utf8')).results.filter(c=>!only.includes(c.slug)) : [];
await Promise.all(Array.from({length:6},async()=>{while(cursor<selected.length){const c=selected[cursor++];results.push(await inspect(c));}}));
results.sort((a,b)=>a.slug.localeCompare(b.slug));
await writeFile('docs/local-rubrics-audit-2026-09-27.json',JSON.stringify({checked_at:new Date().toISOString(),results},null,2)+'\n');
console.log('SUMMARY',results.length,results.filter(r=>r.valid).length);
