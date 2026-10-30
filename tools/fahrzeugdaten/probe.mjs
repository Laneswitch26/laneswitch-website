import { writeFileSync } from 'node:fs';
const H = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36 laneswitch-fahrzeugdaten', Accept: 'application/json,text/plain,*/*' };
const get = async (u, n = 6000) => { try { const r = await fetch(u, { headers: H }); const t = await r.text(); return r.status + ' ' + r.headers.get('content-type') + '\n' + t.slice(0, n); } catch (e) { return 'ERR ' + e; } };
const sql = s => 'https://discodata.eea.europa.eu/sql?query=' + encodeURIComponent(s) + '&p=1&nrOfHits=50';
const out = [];
for (const [label, u, n] of [
  ['sql top', sql("SELECT TOP 2 * FROM [CO2Emission].[latest].[co2cars_2025Pv31] WHERE MS='DE'")],
  ['sql simple', sql("SELECT TOP 1 year FROM [CO2Emission].[latest].[co2cars_2025Pv31]")],
  ['sql info', 'https://discodata.eea.europa.eu/sql?query=' + encodeURIComponent('SELECT TOP 5 * FROM [CO2Emission].[latest].[co2cars_2025Pv31]')],
  ['disco root', 'https://discodata.eea.europa.eu/'],
  ['sdi 2024 final', 'https://sdi.eea.europa.eu/catalogue/datahub/api/records/5018ec17-2348-4c92-8761-6f2377bbd1c0/formatters/json?language=eng', 30000],
  ['sdi 2024 prov', 'https://sdi.eea.europa.eu/catalogue/srv/api/records/5814203d-f36d-4fee-90d4-64bb348d15a6/formatters/json?language=eng', 30000],
]) out.push('### ' + label + ' ' + u + '\n' + await get(u, n));
writeFileSync('tools/fahrzeugdaten/probe-out.txt', out.join('\n\n'));
