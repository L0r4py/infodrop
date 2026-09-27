// Ne déplace un article que dans une tranche de fraîcheur de quinze minutes.
// Tous les articles restent présents et le plus récent reste en tête.
export function diversifyLocalArticles(articles = [], windowMs = 15 * 60_000) {
  const remaining = [...articles].sort((a, b) => new Date(b.heure) - new Date(a.heure));
  const result = [];
  while (remaining.length) {
    const previous = result.at(-1);
    const newest = new Date(remaining[0].heure).getTime();
    const penalty = item => previous
      ? Number(item.source === previous.source) * 2
        + Number(item.territory_zone === previous.territory_zone)
      : 0;
    let choice = 0;
    for (let i = 1; i < Math.min(remaining.length, 8); i++) {
      if (newest - new Date(remaining[i].heure).getTime() > windowMs) break;
      if (penalty(remaining[i]) < penalty(remaining[choice])) choice = i;
    }
    result.push(remaining.splice(choice, 1)[0]);
  }
  return result;
}
