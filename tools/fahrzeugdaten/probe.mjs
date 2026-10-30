import { writeFileSync } from 'node:fs';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const out = [];
const sql = async (label, q, n = 3000) => { try { const r = await fetch('https://discodata.eea.europa.eu/sql', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=' + encodeURIComponent(q) + '&p=1&nrOfHits=2000' }); const t = await r.text(); out.push(`### ${label}\n${q}\n${r.status}\n${t.slice(0, n)}`); } catch (e) { out.push(`### ${label} ERR ${e}`); } };
await sql('is1', 'SELECT TABLE_SCHEMA AS s, TABLE_NAME AS t FROM INFORMATION_SCHEMA.TABLES', 20000);
await sql('is2', "SELECT TABLE_SCHEMA AS s, TABLE_NAME AS t FROM [CO2Emission].INFORMATION_SCHEMA.TABLES", 20000);
await sql('is3', 'SELECT TABLE_SCHEMA AS s, TABLE_NAME AS t FROM INFORMATION_SCHEMA."TABLES" WHERE TABLE_SCHEMA LIKE \'%CO2%\'', 20000);
for (let y = 2010; y <= 2026; y++) for (const s of ['F', 'P']) for (let v = 1; v <= 40; v++) {} // placeholder
await sql('agg2025', "SELECT TOP 20 c.Mk AS mk, c.Cn AS cn, c.Ft AS ft, c.Fm AS fm, c.[Ec (cm3)] AS ec, c.[Ep (KW)] AS kw, AVG(c.[Ewltp (g/km)]) AS co2, AVG(c.Fc) AS fc, SUM(c.R) AS n FROM [CO2Emission].[latest].[co2cars_2025Pv31] c WHERE c.MS='DE' GROUP BY c.Mk, c.Cn, c.Ft, c.Fm, c.[Ec (cm3)], c.[Ep (KW)] ORDER BY SUM(c.R) DESC", 6000);
await sql('t2018', "SELECT TOP 2 * FROM [CO2Emission].[latest].[co2cars_2018Fv15] c WHERE c.MS='DE'");
await sql('t2014', "SELECT TOP 2 * FROM [CO2Emission].[latest].[co2cars_2014Fv10] c WHERE c.MS='DE'");
await sql('t2024', "SELECT TOP 2 * FROM [CO2Emission].[latest].[co2cars_2024Fv30] c WHERE c.MS='DE'");
writeFileSync('tools/fahrzeugdaten/probe-out.txt', out.join('\n\n'));
