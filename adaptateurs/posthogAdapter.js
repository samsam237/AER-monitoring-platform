const fs = require('fs');
const path = require('path');

async function posthogAdapter() {
  const sitesPath = path.join(__dirname, '../data/sites.json');
  const dataFile = fs.readFileSync(sitesPath, 'utf8');
  
  const sites = JSON.parse(dataFile);

  const site = sites.find(s => s.siteName.toLowerCase() === "posthog");

  const configObj = {};
  site.config.forEach(({ key, value }) => {
    configObj[key] = value;
  });

  const res = await fetch('https://app.posthog.com/api/projects/@current/events/', {
    headers: {
      Authorization: `Bearer ${configObj.api_key}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Erreur lors de la requête PostHog');
  const data = await res.json();
  return data.results.map(event => ({
    event: event.event,
    timestamp: event.timestamp,
    distinct_id: event.distinct_id,
    ...event.properties, // Si tu veux inclure d'autres infos
  }));
}
  
module.exports = posthogAdapter;
  