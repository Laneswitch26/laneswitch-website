// Fahrzeugkosten-Check: Datenbestand, Suche und Rechenlogik.
// Aufruf: node --test qa/fahrzeugkosten.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist/konzept/fahrzeugkosten');
const read = file => JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
const index = read('daten/index.json');
const { buildSearchIndex, searchModels, taxFor, taxRule, monthly, toVariant, everyday } = await import(path.join(dir, 'rechnen.mjs'));

test('Übersicht: mindestens zehn Baujahre, viele Hersteller und Modelle', () => {
  assert.ok(index.jahre[1] - index.jahre[0] >= 10, `Baujahre ${index.jahre}`);
  assert.ok(index.marken.length >= 30, 'zu wenige Hersteller');
  assert.ok(index.marken.reduce((s, m) => s + m.modelle.length, 0) >= 400, 'zu wenige Modelle');
  assert.equal(index.beliebt.length, 3);
});

test('jede Herstellerdatei existiert, passt zur Übersicht und hat plausible Werte', () => {
  const files = new Set(readdirSync(path.join(dir, 'daten')));
  for (const make of index.marken) {
    assert.ok(files.has(`${make.id}.json`), `${make.id}.json fehlt`);
    const data = read(`daten/${make.id}.json`);
    assert.equal(createHash('sha1').update(JSON.stringify(data)).digest('hex').slice(0, 10), make.v, `${make.id}: Versionsschlüssel veraltet`);
    for (const [name, from, to] of make.modelle) {
      const list = data.modelle[name];
      assert.ok(list?.length, `${make.name} ${name} ohne Varianten`);
      for (const v of list) {
        assert.ok(v[0] >= from && v[0] <= to, `${name}: Baujahr außerhalb`);
        assert.ok(['B', 'D'].includes(v[1]) && [0, 1].includes(v[2]), `${name}: Antrieb`);
        assert.ok(v[4] >= 25 && v[4] <= 600 && v[3] >= 600, `${name}: Leistung/Hubraum`);
        assert.ok(v[7] >= 2.5 && v[7] <= 20, `${name}: Verbrauch ${v[7]}`);
        assert.ok(['W', 'N'].includes(v[6]) && v[8] >= 25, `${name}: Zyklus/Anzahl`);
      }
    }
  }
});

test('Suche findet gängige Eingaben', () => {
  const entries = buildSearchIndex(index);
  const top = q => searchModels(entries, q)[0];
  assert.equal(`${top('Opel Corsa').make} ${top('Opel Corsa').model}`, 'Opel Corsa');
  assert.equal(top('corsa').model, 'Corsa');
  assert.equal(top('vw golf 2017').model, 'Golf');
  assert.equal(top('vw golf 2017').year, 2017);
  assert.equal(top('skoda fabia').make, 'Škoda');
  assert.equal(top('i10').model, 'i10');
  assert.equal(top('yaris hybrid').model, 'Yaris');
  assert.equal(searchModels(entries, 'gibtsnicht xyz').length, 0);
});

test('Empfehlungen: alle Stufen mit rechenbarer Beispielvariante im passenden Baujahr', () => {
  const rec = index.empfehlungen;
  assert.ok(rec && rec.stufen.length === 3, 'Budgetstufen fehlen');
  const config = read('empfehlungen.json');
  for (const [i, tier] of rec.stufen.entries()) {
    assert.equal(tier.fahrzeuge.length, config.stufen[i].fahrzeuge.length, `${tier.id}: Fahrzeug ohne Daten`);
    for (const f of tier.fahrzeuge) {
      const [from, to] = f.baujahre === 'neu' ? [index.jahre[1], index.jahre[1]] : f.baujahre;
      assert.ok(f.variante[0] >= from && f.variante[0] <= to, `${f.name}: Beispiel außerhalb der Baujahre`);
      const c = monthly(toVariant(f.variante, f.hersteller, f.name));
      assert.ok(c.low > 100 && c.high < 1000 && c.low < c.high, `${f.name}: Kosten unplausibel`);
    }
  }
});

test('Kfz-Steuer und Verbrauch folgen dem Baujahr', () => {
  assert.equal(taxRule(2013), '2012'); assert.equal(taxRule(2017), '2014'); assert.equal(taxRule(2021), '2021');
  // 1,2-l-Benziner mit 120 g: 12 × 2 € Hubraum (je angefangene 100 cm³); ab 2021: (115−95)×2 + 5×2,2 = 51 €; 2014er-Regel: 25 × 2 € = 50 €
  const car = { cc: 1199, fuel: 'Benzin', co2: 120 };
  assert.equal(taxFor({ ...car, year: 2022 }), 24 + 51);
  assert.equal(taxFor({ ...car, year: 2016 }), 24 + 50);
  const wltp = { consumption: 5, cycle: 'W' }, nedc = { consumption: 5, cycle: 'N' };
  assert.ok(Math.abs(everyday(wltp) - 5.4) < 1e-9);
  assert.ok(everyday(nedc) > everyday(wltp));
});

test('Seite bindet Module mit Version ein und lädt keine alte Fahrzeugliste mehr', () => {
  const html = readFileSync(path.join(dir, 'index.html'), 'utf8');
  assert.match(html, /rechner\.mjs\?v=\d+/);
  assert.doesNotMatch(html, /fahrzeuge-2025\.js/);
  assert.ok(!existsSync(path.join(dir, 'fahrzeuge-2025.js')));
});
