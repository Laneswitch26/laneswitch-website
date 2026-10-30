// Baut die Fahrzeugdaten für den Fahrzeugkosten-Check aus den amtlichen EEA-Daten
// (Monitoring der CO₂-Emissionen neuer Pkw, Verordnung (EU) 2019/631), nur Erstzulassungen in Deutschland.
//
//   node tools/fahrzeugdaten/build.mjs                 # live von discodata.eea.europa.eu (GitHub-Ablauf)
//   node tools/fahrzeugdaten/build.mjs --raw <ordner>  # aus zwischengespeicherten Rohdaten <jahr>.json.gz
//
// Ergebnis: dist/konzept/fahrzeugkosten/daten/index.json und je Hersteller eine Datei.
// Die Datei wird nur neu geschrieben, wenn sich der Inhalt ändert, damit der Ablauf keine leeren Updates erzeugt.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeMake, normalizeModel, normalizeDrive, displayModel, modelKey, startsWithMake } from './normalize.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '../..');
const outDir = path.join(root, 'dist/konzept/fahrzeugkosten/daten');
const recommendationsFile = path.join(root, 'dist/konzept/fahrzeugkosten/empfehlungen.json');
const args = process.argv.slice(2);
const rawDir = args.includes('--raw') ? args[args.indexOf('--raw') + 1] : null;

const FIRST_YEAR = 2013; // 2010 bis 2012 sind lückenhaft (fehlende Leistungs- und CO₂-Angaben, teils ganze Hersteller)
const MIN_VARIANT = 25;   // Varianten mit weniger Erstzulassungen pro Jahr sind meist Sonderfälle oder Datenfehler
const MIN_MODEL = 300;    // Modelle mit weniger Fahrzeugen über alle Jahre werden nicht angeboten

// ---------- Datenabruf ----------
const UA = 'Mozilla/5.0 (compatible; laneswitch-fahrzeugdaten/1.0; +https://laneswitch.online)';
async function sql(query, page = 1, size = 5000) {
  let last;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch('https://discodata.eea.europa.eu/sql', {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `query=${encodeURIComponent(query)}&p=${page}&nrOfHits=${size}`,
      });
      const json = await response.json();
      if (json.errors) { const e = new Error(JSON.stringify(json.errors)); e.sqlError = json.errors[0]?.errorcode; throw e; }
      return json.results;
    } catch (error) {
      last = error;
      if (error.sqlError === 10003) throw error; // Tabelle existiert nicht
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw last;
}

async function tableExists(name) {
  try { await sql(`SELECT TOP 1 c.Year AS y FROM [CO2Emission].[latest].[${name}] c`, 1, 1); return true; }
  catch (error) { if (error.sqlError === 10003) return false; throw error; }
}

// Ab 2022 veröffentlicht die EEA je Jahr eigene Tabellen (vorläufig "P", endgültig "F") mit fortlaufender Versionsnummer.
async function discoverTables() {
  const thisYear = new Date().getUTCFullYear();
  const found = {};
  const candidates = [];
  for (let year = 2022; year <= thisYear; year++) for (const status of ['F', 'P']) for (let v = 22; v <= 60; v++) candidates.push([year, status, v]);
  for (let i = 0; i < candidates.length; i += 12) {
    const batch = candidates.slice(i, i + 12);
    const results = await Promise.all(batch.map(([y, s, v]) => tableExists(`co2cars_${y}${s}v${v}`)));
    batch.forEach(([y, s, v], k) => {
      if (!results[k]) return;
      const current = found[y];
      // Endgültige Daten haben Vorrang vor vorläufigen, sonst die höchste Version.
      if (!current || (s === 'F' && current.status === 'P') || (s === current.status && v > current.version)) found[y] = { status: s, version: v, table: `co2cars_${y}${s}v${v}` };
    });
  }
  return found;
}

function groupQuery(table, where) {
  return `SELECT c.Mk AS mk, c.Cn AS cn, c.Ft AS ft, c.Fm AS fm, c.[Ec (cm3)] AS ec, c.[Ep (KW)] AS kw, AVG(c.[E (g/km)]) AS e, AVG(c.[Enedc (g/km)]) AS en, AVG(c.[Ewltp (g/km)]) AS ew, AVG(c.Fc) AS fc, SUM(c.R) AS n FROM [CO2Emission].[latest].[${table}] c WHERE c.MS='DE' ${where} GROUP BY c.Mk, c.Cn, c.Ft, c.Fm, c.[Ec (cm3)], c.[Ep (KW)]`;
}

async function fetchYear(table, where) {
  const rows = [];
  for (let page = 1; ; page++) { const part = await sql(groupQuery(table, where), page); rows.push(...part); if (part.length < 5000) break; }
  return rows;
}

async function loadSources() {
  const years = {};
  const sources = {};
  if (rawDir) {
    for (const file of readdirSync(rawDir).filter(f => /^\d{4}\.json\.gz$/.test(f))) {
      const year = +file.slice(0, 4);
      if (year < FIRST_YEAR) continue;
      let rows = JSON.parse(gunzipSync(readFileSync(path.join(rawDir, file))));
      if (rows.some(r => r.st)) { const final = rows.filter(r => r.st === 'F'); rows = final.length ? final : rows; }
      years[year] = rows; sources[year] = { table: 'raw', status: rows[0]?.st || '?' };
    }
    return { years, sources };
  }
  const tables = await discoverTables();
  const thisYear = new Date().getUTCFullYear();
  for (let year = FIRST_YEAR; year <= thisYear; year++) {
    if (tables[year]) { years[year] = await fetchYear(tables[year].table, ''); sources[year] = tables[year]; }
    else if (year <= 2021) { years[year] = await fetchYear('co2cars', `AND c.Year=${year} AND c.Status='F'`); sources[year] = { table: 'co2cars', status: 'F' }; }
    if (years[year]) console.log(`${year}: ${years[year].length} Gruppen aus ${sources[year].table}`);
  }
  return { years, sources };
}

// ---------- Aufbereitung ----------
const round1 = x => Math.round(x * 10) / 10;
function aggregate(years) {
  const variants = new Map();
  const modelNames = new Map();
  for (const [yearKey, rows] of Object.entries(years)) {
    const year = +yearKey;
    // Die EEA-Schnittstelle mittelt parallel; Kleinstabweichungen (8,2499… statt 8,25) und wechselnde Reihenfolgen
    // würden sonst bei jedem Lauf andere Rundungen ergeben. Deshalb Werte vorab runden und Zeilen fest sortieren.
    const fix = x => (x == null ? null : Math.round(+x * 1000) / 1000);
    const stable = rows.map(r => ({ ...r, e: fix(r.e), en: fix(r.en), ew: fix(r.ew), fc: fix(r.fc) }))
      .sort((a, b) => JSON.stringify([a.mk, a.cn, a.ft, a.fm, a.ec, a.kw, a.n]).localeCompare(JSON.stringify([b.mk, b.cn, b.ft, b.fm, b.ec, b.kw, b.n])));
    for (const r of stable) {
      const n = +r.n || 0; if (n <= 0) continue;
      const make = normalizeMake(r.mk); if (!make) continue;
      const wltp = r.ew > 0 ? r.ew : null;
      const co2 = wltp ?? (r.en > 0 ? r.en : r.e > 0 ? r.e : null);
      if (!co2 || co2 < 60 || co2 > 450) continue;
      const drive = normalizeDrive(r.ft, r.fm, co2); if (!drive) continue;
      const kw = Math.round(+r.kw), cc = Math.round(+r.ec);
      if (!(kw >= 25 && kw <= 600) || !(cc >= 600 && cc <= 8500)) continue;
      const model = normalizeModel(r.cn, make, 'combustion'); if (!model) continue;
      // Ältere Jahrgänge führen Vollhybride teils als reinen Benziner. Benziner ab 1,3 l unter 96 g CO₂ (NEFZ) sind praktisch immer Hybride.
      if (!wltp && year < 2021 && drive.fuel === 'B' && !drive.hybrid && cc >= 1300 && co2 < 96) drive.hybrid = true;
      const cycle = wltp ? 'W' : 'N';
      const consumption = r.fc > 0 ? +r.fc : co2 / (drive.fuel === 'D' ? 26.5 : 23.7);
      if (consumption < 2.5 || consumption > 20) continue;
      const mkey = modelKey(model);
      const names = modelNames.get(make + '|' + mkey) || new Map(); modelNames.set(make + '|' + mkey, names);
      names.set(model, (names.get(model) || 0) + n * (startsWithMake(model) ? .01 : 1) * (model.includes(' ') || model.length < 9 ? 3 : 1));
      const key = [make, mkey, year, drive.fuel, drive.hybrid ? 1 : 0, kw, cc].join('|');
      const v = variants.get(key) || { make, model: mkey, year, fuel: drive.fuel, hybrid: drive.hybrid, kw, cc, n: 0, co2: 0, cons: 0, w: 0 };
      v.n += n; v.co2 += co2 * n; v.cons += consumption * n; v.w += cycle === 'W' ? n : 0;
      variants.set(key, v);
    }
  }
  const makes = new Map();
  for (const v of variants.values()) {
    if (v.n < MIN_VARIANT) continue;
    const make = makes.get(v.make) || new Map(); makes.set(v.make, make);
    const names = modelNames.get(v.make + '|' + v.model);
    const model = [...names.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const list = make.get(model) || []; make.set(model, list);
    list.push([v.year, v.fuel, v.hybrid ? 1 : 0, v.cc, v.kw, Math.round(v.co2 / v.n), v.w / v.n >= .5 ? 'W' : 'N', round1(v.cons / v.n), v.n]);
  }
  return makes;
}

const slug = value => value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function writeIfChanged(file, data) {
  const text = JSON.stringify(data);
  if (existsSync(file) && readFileSync(file, 'utf8') === text) return false;
  writeFileSync(file, text);
  return true;
}

// Empfehlungen: redaktionell gepflegte Liste; hier wird je Modell und Baujahr-Spanne die häufigste Variante als Rechenbeispiel ermittelt.
function resolveRecommendations(makes, latestYear) {
  if (!existsSync(recommendationsFile)) return null;
  const config = JSON.parse(readFileSync(recommendationsFile, 'utf8'));
  const problems = [];
  const tiers = config.stufen.map(tier => ({
    ...tier,
    fahrzeuge: tier.fahrzeuge.map(item => {
      const models = makes.get(item.hersteller);
      const list = models?.get(item.modell) ? models.get(item.modell).map(v => [...v]) : null;
      if (!list) { problems.push(`${item.hersteller} ${item.modell}`); return null; }
      const [from, to] = item.baujahre === 'neu' ? [latestYear, latestYear] : item.baujahre;
      const pool = list.filter(v => v[0] >= from && v[0] <= to && (!item.antrieb || (item.antrieb === 'Hybrid' ? v[2] : !v[2] && (item.antrieb === 'Diesel' ? v[1] === 'D' : v[1] === 'B'))));
      if (!pool.length) { problems.push(`${item.hersteller} ${item.modell} ${from}–${to}`); return null; }
      // häufigste Leistungsstufe über die Spanne, davon das mittlere Baujahr
      const byPower = new Map();
      for (const v of pool) { const k = `${v[1]}|${v[2]}|${v[4]}|${v[3]}`; byPower.set(k, (byPower.get(k) || 0) + v[8]); }
      const best = [...byPower.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const same = pool.filter(v => `${v[1]}|${v[2]}|${v[4]}|${v[3]}` === best).sort((a, b) => a[0] - b[0]);
      const ref = same[Math.floor((same.length - 1) / 2)];
      return { ...item, id: slug(item.hersteller), name: displayModel(item.modell, item.hersteller), modell: item.modell, variante: ref };
    }).filter(Boolean),
  }));
  if (problems.length) throw new Error(`Empfehlungen ohne passende Daten: ${problems.join(', ')}`);
  return { stand: config.stand, hinweis: config.hinweis, quellen: config.quellen, stufen: tiers };
}

const { years, sources } = await loadSources();
const makes = aggregate(years);
mkdirSync(outDir, { recursive: true });
const allYears = Object.keys(years).map(Number).sort((a, b) => a - b);
const latestYear = Math.max(...allYears);
const index = { quelle: 'EEA – Monitoring der CO₂-Emissionen neuer Pkw (Erstzulassungen in Deutschland)', jahre: [allYears[0], latestYear], vorlaeufig: allYears.filter(y => sources[y]?.status === 'P'), marken: [] };
const written = new Set();
let changed = 0;
const popularLatest = [];
for (const [make, models] of [...makes.entries()].sort((a, b) => a[0].localeCompare(b[0], 'de'))) {
  const modelEntries = [];
  const data = {};
  for (const [model, list] of models) {
    const total = list.reduce((s, v) => s + v[8], 0);
    if (total < MIN_MODEL) continue;
    list.sort((a, b) => b[0] - a[0] || a[4] - b[4] || a[1].localeCompare(b[1]));
    const name = displayModel(model, make);
    data[name] = list;
    const ys = list.map(v => v[0]);
    modelEntries.push([name, Math.min(...ys), Math.max(...ys), total]);
    for (const v of list) if (v[0] === latestYear) popularLatest.push({ make, model: name, v });
  }
  if (!modelEntries.length) continue;
  const id = slug(make);
  modelEntries.sort((a, b) => a[0].localeCompare(b[0], 'de'));
  const payload = { name: make, modelle: data };
  const version = createHash('sha1').update(JSON.stringify(payload)).digest('hex').slice(0, 10); // Cache-Schlüssel
  index.marken.push({ id, name: make, v: version, n: modelEntries.reduce((s, m) => s + m[3], 0), modelle: modelEntries });
  if (writeIfChanged(path.join(outDir, `${id}.json`), payload)) changed++;
  written.add(`${id}.json`);
}
index.beliebt = popularLatest.sort((a, b) => b.v[8] - a.v[8]).slice(0, 3).map(p => ({ id: slug(p.make), hersteller: p.make, name: p.model, variante: p.v }));
const rawMakes = new Map([...makes.entries()].map(([make, models]) => [make, new Map([...models.entries()])]));
index.empfehlungen = resolveRecommendations(rawMakes, latestYear);
for (const file of readdirSync(outDir)) if (file !== 'index.json' && !written.has(file)) { rmSync(path.join(outDir, file)); changed++; }
if (writeIfChanged(path.join(outDir, 'index.json'), index)) changed++;
console.log(`${index.marken.length} Hersteller, ${index.marken.reduce((s, m) => s + m.modelle.length, 0)} Modelle, Baujahre ${index.jahre.join('–')}; ${changed} Datei(en) geändert`);
