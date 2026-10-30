import { writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const post = async (q, p, n) => { for (let a = 0; a < 4; a++) { try { const r = await fetch('https://discodata.eea.europa.eu/sql', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=' + encodeURIComponent(q) + `&p=${p}&nrOfHits=${n}` }); const j = await r.json(); if (j.errors) throw new Error(JSON.stringify(j.errors)); return j.results; } catch (e) { console.log('retry', e.message); await new Promise(r => setTimeout(r, 3000)); } } throw new Error('failed'); };
const tables = [];
for (let y = 2010; y <= 2022; y++) tables.push([y, `[CO2Emission].[latest].[co2cars]`, `AND c.Year=${y}`]);
tables.push([2023, '[CO2Emission].[latest].[co2cars_2023Fv28]', ''], [2024, '[CO2Emission].[latest].[co2cars_2024Fv30]', ''], [2025, '[CO2Emission].[latest].[co2cars_2025Pv31]', '']);
mkdirSync('tools/fahrzeugdaten/raw', { recursive: true });
const log = [];
for (const [y, t, w] of tables) {
  const q = `SELECT c.Mk AS mk, c.MMS AS mms, c.Man AS man, c.Cn AS cn, c.Ft AS ft, c.Fm AS fm, c.[Ec (cm3)] AS ec, c.[Ep (KW)] AS kw, AVG(c.[E (g/km)]) AS e, AVG(c.[Enedc (g/km)]) AS en, AVG(c.[Ewltp (g/km)]) AS ew, AVG(c.Fc) AS fc, AVG(c.[M (kg)]) AS m, SUM(c.R) AS n, c.Status AS st, c.Version_file AS vf FROM ${t} c WHERE c.MS='DE' ${w} GROUP BY c.Mk, c.MMS, c.Man, c.Cn, c.Ft, c.Fm, c.[Ec (cm3)], c.[Ep (KW)], c.Status, c.Version_file`;
  const rows = []; const size = 5000;
  for (let p = 1; ; p++) { const r = await post(q, p, size); rows.push(...r); if (r.length < size) break; }
  { const by = {}; for (const r of rows) by[r.st + r.vf] = (by[r.st + r.vf] || 0) + (r.n || 0); log.push(`${y}: ${rows.length} Gruppen ${JSON.stringify(by)}`); }
  writeFileSync(`tools/fahrzeugdaten/raw/${y}.json.gz`, gzipSync(JSON.stringify(rows)));
}
writeFileSync('tools/fahrzeugdaten/probe-out.txt', log.join('\n'));
