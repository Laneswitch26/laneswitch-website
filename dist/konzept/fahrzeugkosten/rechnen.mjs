// Fahrzeugkosten-Check · Rechen- und Suchlogik ohne Seitenbezug (auch in Node testbar).
// Variante: [baujahr, kraftstoff 'B'|'D', hybrid 0|1, hubraum, kW, co2, zyklus 'W'|'N', verbrauch l/100 km, erstzulassungen]

export const FUEL = { B: 'Benzin', D: 'Diesel' };
export const toVariant = (v, make, model) => ({
  make, model, year: v[0], fuel: FUEL[v[1]], fuelCode: v[1], hybrid: Boolean(v[2]), cc: v[3], kw: v[4], co2: v[5],
  cycle: v[6], consumption: v[7], registrations: v[8],
  drive: v[2] ? `Hybrid (${FUEL[v[1]]})` : FUEL[v[1]],
});
export const ps = kw => Math.round(kw * 1.35962);

// ---------- Suche ----------
const ALIASES = { vw: 'volkswagen', mercedes: 'mercedesbenz', benz: 'mercedesbenz', mb: 'mercedesbenz', skoda: 'skoda', citroen: 'citroen', chevi: 'chevrolet', alfa: 'alfaromeo', landrover: 'landrover' };
export const fold = value => String(value).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9+!]/g, '');

export function buildSearchIndex(index) {
  const entries = [];
  for (const make of index.marken) {
    const makeKey = fold(make.name);
    for (const [name, from, to, total] of make.modelle) entries.push({ makeId: make.id, make: make.name, model: name, from, to, total, makeKey, modelKey: fold(name) });
  }
  return entries;
}

// Liefert passende Modelle. Akzeptiert z. B. "corsa", "opel corsa", "vw golf 2017", "skoda fabia", "i10".
export function searchModels(entries, query, limit = 8) {
  const words = String(query).trim().split(/[\s,;/]+/).filter(Boolean);
  if (!words.length) return [];
  let year = null;
  const tokens = [];
  for (const word of words) {
    if (/^(19|20)\d\d$/.test(word)) { year = +word; continue; }
    const key = fold(word); if (!key) continue;
    if (/^(hybrid|benzin|benziner|diesel|automatik|schaltung|kombi|limousine|neu|gebraucht)$/.test(key)) continue; // Antrieb wird bei der Motorisierung gewählt
    tokens.push(ALIASES[key] || key);
  }
  if (!tokens.length && !year) return [];
  const results = [];
  for (const e of entries) {
    let score = 0, ok = true;
    const joined = e.makeKey + e.modelKey;
    for (const t of tokens) {
      if (e.modelKey === t) score += 60;
      else if (e.modelKey.startsWith(t)) score += 40;
      else if (e.makeKey === t || e.makeKey.startsWith(t)) score += 25;
      else if (e.modelKey.includes(t)) score += 15;
      else if (joined.includes(t)) score += 8;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (year && (year < e.from || year > e.to)) continue;
    score += Math.log10(e.total + 10) * 6; // häufige Modelle zuerst
    if (e.modelKey.length > 0 && tokens.length && tokens.every(t => e.modelKey.startsWith(t) || e.makeKey.startsWith(t))) score += 5;
    results.push({ ...e, year, score });
  }
  return results.sort((a, b) => b.score - a.score || b.total - a.total).slice(0, limit);
}

// ---------- Rechnen ----------
// Kfz-Steuer nach Erstzulassungsjahr. Die Fahrzeugdaten nennen das Jahr der Erstzulassung in Deutschland.
export function taxRule(year) { return year >= 2021 ? '2021' : year >= 2014 ? '2014' : year >= 2012 ? '2012' : '2009'; }
export const TAX_RULE_NAMES = { 2021: 'Erstzulassung ab 2021', 2014: 'Erstzulassung 2014 bis 2020', 2012: 'Erstzulassung 2012 bis 2013', 2009: 'Erstzulassung Juli 2009 bis 2011' };
export function taxFor(v, rule = taxRule(v.year)) {
  const engine = Math.ceil(v.cc / 100) * (v.fuel === 'Diesel' ? 9.5 : 2);
  if (rule === '2021') {
    let co2 = 0;
    [[95, 115, 2], [115, 135, 2.2], [135, 155, 2.5], [155, 175, 2.9], [175, 195, 3.4], [195, 999, 4]].forEach(([from, to, rate]) => { if (v.co2 > from) co2 += (Math.min(v.co2, to) - from) * rate; });
    return Math.floor(engine + co2);
  }
  const threshold = { 2014: 95, 2012: 110, 2009: 120 }[rule] || 95;
  return Math.floor(engine + Math.max(0, v.co2 - threshold) * 2);
}

export function insurance(v, km, age, license, cover) {
  const base = { liability: [82, 132], partial: [103, 168], full: [145, 248] }[cover];
  const power = v.kw <= 60 ? .9 : v.kw <= 85 ? 1 : v.kw <= 110 ? 1.1 : v.kw <= 140 ? 1.22 : 1.38;
  const mileage = km <= 8000 ? .9 : km <= 12000 ? 1 : km <= 18000 ? 1.1 : 1.2;
  const ageF = age <= 20 ? 1.12 : age <= 24 ? 1.04 : age <= 29 ? .96 : .9;
  const exp = license === '0' ? 1.08 : license === '1' ? 1 : .92;
  return base.map(x => Math.round(x * power * mileage * ageF * exp));
}

// NEFZ-Werte (ältere Baujahre) liegen im Mittel rund ein Fünftel unter WLTP. Modellannahme zur Vergleichbarkeit.
export const NEDC_TO_WLTP = 1.2;
export const ROUTE_FACTORS = { city: 1.15, mixed: 1.08, highway: 1.12 };
export function everyday(v, route = 'mixed') { return v.consumption * (v.cycle === 'N' ? NEDC_TO_WLTP : 1) * ROUTE_FACTORS[route]; }

// Wartungsreserve: Grundbetrag, Fahrleistung, Leistung; ältere Fahrzeuge bekommen einen Aufschlag (Modellannahme).
export function maintenance(v, km, now = new Date().getFullYear()) {
  const vehicleAge = Math.max(0, now - v.year);
  const ageExtra = Math.min(20, Math.max(0, vehicleAge - 5) * 2);
  return 32 + km / 1000 * 1.45 + Math.max(0, v.kw - 60) * .12 + ageExtra;
}

export const FUEL_PRICES = { Benzin: 2.17, Diesel: 2.25 };
export function monthly(v, { km = 12000, price = FUEL_PRICES[v.fuel], route = 'mixed', age = 18, license = '0', cover = 'partial', now } = {}) {
  const ins = insurance(v, km, age, license, cover);
  const litres = everyday(v, route);
  const fuel = km * litres / 100 * price / 12;
  const tax = taxFor(v) / 12;
  const reserve = maintenance(v, km, now);
  return { ins, litres, fuel, tax, reserve, low: ins[0] + fuel + tax + reserve, high: ins[1] + fuel + tax + reserve };
}
