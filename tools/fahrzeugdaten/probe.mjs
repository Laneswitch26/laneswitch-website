import { writeFileSync } from 'node:fs';
const q = async sql => { const u = 'https://discodata.eea.europa.eu/sql?query=' + encodeURIComponent(sql) + '&p=1&nrOfHits=500'; const r = await fetch(u); const t = await r.text(); return r.status + ' ' + t.slice(0, 20000); };
const out = [];
for (const sql of [
  "SELECT TABLE_SCHEMA, TABLE_NAME FROM [CO2Emission].INFORMATION_SCHEMA.TABLES",
  "SELECT TOP 3 * FROM [CO2Emission].[latest].[co2cars_2025Pv31] WHERE MS='DE'",
  "SELECT TOP 3 * FROM [CO2Emission].[latest].[co2cars_2014Fv10] WHERE MS='DE'",
]) out.push('### ' + sql + '\n' + await q(sql));
writeFileSync('tools/fahrzeugdaten/probe-out.txt', out.join('\n\n'));
