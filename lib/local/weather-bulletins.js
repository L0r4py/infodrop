// Pyrénées uniquement : reconnaître des gabarits de bulletin, pas un sujet météo.
export function isAutomaticWeatherBulletin(title = '') {
  const text = String(title).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  // En cas de doute, conserver l'information événementielle ou journalistique.
  if (/\b(alerte|alertes|vigilance|exceptionnel\w*|orage\w*|inondation\w*|crue\w*|canicule\w*|tempete\w*|cyclone\w*|tornade\w*|avalanche\w*|intemperies|degats|victimes|evacuation\w*|fermeture\w*|routes? coupe\w*|consequences|climat\w*|rechauffement|record\w*|pourquoi|comment|reportage|enquete|entretien|interview|explique\w*|analyse\w*)\b/.test(text)) return false;
  if (/^(?:la\s+)?(?:meteo|previsions\s+meteo)\s+a\s+\S/.test(text)) return true;
  // Autres bulletins : intitulé météo explicite ET plusieurs mesures chiffrées.
  const bulletin = /^(?:(?:bulletin|previsions)\s+meteo\b|meteo\s*[:–—-])/.test(text);
  const temperatures = /\b(?:min(?:imale)?|max(?:imale)?)\s*[:=]?\s*-?\d+\s*°/.test(text)
    && /\bmax(?:imale)?\s*[:=]?\s*-?\d+\s*°/.test(text)
    && /\bmin(?:imale)?\s*[:=]?\s*-?\d+\s*°/.test(text);
  const rainAndWind = /\bpluie\s*[:=]?\s*\d+(?:[.,]\d+)?\s*(?:mm|%)/.test(text)
    && /\bvent\s*[:=]?\s*\d+\s*km\/?h/.test(text);
  return bulletin && (temperatures || rainAndWind);
}
