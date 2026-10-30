import { writeFileSync } from 'node:fs';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const out = [];
const sql = async (label, q, n = 1500) => { const t0 = Date.now(); try { const r = await fetch('https://discodata.eea.europa.eu/sql', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=' + encodeURIComponent(q) + '&p=1&nrOfHits=5' }); const t = await r.text(); out.push(`### ${label} (${Date.now() - t0} ms)\n${q}\n${r.status}\n${t.slice(0, n)}`); } catch (e) { out.push(`### ${label} ERR ${e}`); } };
const T = '[CO2Emission].[latest].[co2cars_2024Fv30]';
await sql('count', `SELECT COUNT(*) AS n FROM ${T} c WHERE c.MS='DE'`);
await sql('grp1', `SELECT c.Mk AS mk, COUNT(*) AS n FROM ${T} c WHERE c.MS='DE' GROUP BY c.Mk`);
await sql('grp2', `SELECT c.Mk AS mk, c.Cn AS cn, SUM(c.R) AS n FROM ${T} c WHERE c.MS='DE' GROUP BY c.Mk, c.Cn`);
await sql('grp3', `SELECT c.Mk AS mk, c.Cn AS cn, c.Ft AS ft, c.Fm AS fm, c.[Ec (cm3)] AS ec, c.[Ep (KW)] AS kw, AVG(c.[Ewltp (g/km)]) AS co2, AVG(c.Fc) AS fc, SUM(c.R) AS n FROM ${T} c WHERE c.MS='DE' GROUP BY c.Mk, c.Cn, c.Ft, c.Fm, c.[Ec (cm3)], c.[Ep (KW)]`);
await sql('distinct', `SELECT DISTINCT c.Mk AS mk FROM ${T} c WHERE c.MS='DE'`);
for (const name of ['co2cars_2023Fv27','co2cars_2023Fv28','co2cars_2022Fv25','co2cars_2021Fv23','co2cars_2020Fv20','co2cars_2019Fv18','co2cars_2018Fv16','co2cars','co2cars_all'])
  await sql('tbl ' + name, `SELECT TOP 1 c.Year AS y FROM [CO2Emission].[latest].[${name}] c`, 300);
writeFileSync('tools/fahrzeugdaten/probe-out.txt', out.join('\n\n'));
