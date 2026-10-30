import { writeFileSync } from 'node:fs';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const post = async (q, n = 5) => { const t0 = Date.now(); const r = await fetch('https://discodata.eea.europa.eu/sql', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=' + encodeURIComponent(q) + '&p=1&nrOfHits=' + n }); const j = await r.json(); j.ms = Date.now() - t0; return j; };
const out = [];
for (const y of [2012, 2016, 2019, 2021]) out.push(y + ': ' + JSON.stringify(await post(`SELECT TOP 2 * FROM [CO2Emission].[latest].[co2cars] c WHERE c.MS='DE' AND c.Year=${y}`)).slice(0, 2200));
out.push('agg2016: ' + JSON.stringify(await post(`SELECT c.Mk AS mk, c.Cn AS cn, c.Ft AS ft, c.[Ec (cm3)] AS ec, c.[Ep (KW)] AS kw, AVG(c.[Enedc (g/km)]) AS co2n, AVG(c.[Ewltp (g/km)]) AS co2w, SUM(c.r) AS n FROM [CO2Emission].[latest].[co2cars] c WHERE c.MS='DE' AND c.Year=2016 GROUP BY c.Mk, c.Cn, c.Ft, c.[Ec (cm3)], c.[Ep (KW)]`, 5)).slice(0, 2000));
out.push('rows2016: ' + JSON.stringify(await post(`SELECT COUNT(*) AS n FROM [CO2Emission].[latest].[co2cars] c WHERE c.MS='DE' AND c.Year=2016`)));
out.push('page size test: ' + JSON.stringify(await post(`SELECT c.Mk AS mk, COUNT(*) AS n FROM [CO2Emission].[latest].[co2cars_2024Fv30] c WHERE c.MS='DE' GROUP BY c.Mk`, 10000)).length);
writeFileSync('tools/fahrzeugdaten/probe-out.txt', out.join('\n\n'));
