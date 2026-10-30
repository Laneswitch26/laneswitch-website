import { writeFileSync } from 'node:fs';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const post = async q => { const r = await fetch('https://discodata.eea.europa.eu/sql', { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=' + encodeURIComponent(q) + '&p=1&nrOfHits=200' }); return r.json(); };
const out = [];
out.push('co2cars years: ' + JSON.stringify(await post('SELECT DISTINCT c.Year AS y FROM [CO2Emission].[latest].[co2cars] c')));
const found = [];
for (let y = 2010; y <= 2026; y++) for (const s of ['F', 'P']) {
  const jobs = []; for (let v = 1; v <= 40; v++) { const n = `co2cars_${y}${s}v${v}`; jobs.push(post(`SELECT TOP 1 c.Year AS y FROM [CO2Emission].[latest].[${n}] c`).then(j => j.results ? n : null).catch(() => null)); }
  for (const n of await Promise.all(jobs)) if (n) found.push(n);
}
out.push('tables: ' + found.join(' '));
// 2014 sample columns
const old = found.find(n => n.startsWith('co2cars_2014')) || found.find(n => n.startsWith('co2cars_2016'));
if (old) out.push(old + ': ' + JSON.stringify(await post(`SELECT TOP 2 * FROM [CO2Emission].[latest].[${old}] c WHERE c.MS='DE'`)).slice(0, 2500));
const mid = found.find(n => n.startsWith('co2cars_2019'));
if (mid) out.push(mid + ': ' + JSON.stringify(await post(`SELECT TOP 2 * FROM [CO2Emission].[latest].[${mid}] c WHERE c.MS='DE'`)).slice(0, 2500));
writeFileSync('tools/fahrzeugdaten/probe-out.txt', out.join('\n\n'));
