// Vereinheitlicht Hersteller-, Modell- und Antriebsangaben aus den EEA-Rohdaten.
// Die EEA-Daten schreiben dieselbe Marke je nach Jahr unterschiedlich ("VOLKSWAGEN, VW", "VOLKSWAGEN. VW" …)
// und hängen manchmal Marke oder Antrieb an den Modellnamen. Hier wird alles auf eine Schreibweise gebracht.

const clean = value => String(value ?? '').toUpperCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

// Reihenfolge zählt: spezifischere Muster zuerst.
const MAKE_RULES = [
  [/^V?OLKSWAGEN/, 'Volkswagen'], [/^VW\b/, 'Volkswagen'],
  [/^MERCEDES/, 'Mercedes-Benz'], [/^SMART\b/, 'smart'],
  [/^BMW\b/, 'BMW'], [/^MINI\b/, 'MINI'], [/^ALPINA\b/, 'Alpina'],
  [/^AUDI\b|^QUATTRO$/, 'Audi'], [/^SKODA/, 'Škoda'], [/^SEAT\b/, 'SEAT'], [/^CUPRA\b/, 'Cupra'],
  [/^PORSCHE/, 'Porsche'], [/^OPEL/, 'Opel'], [/^FORD/, 'Ford'],
  [/^CITROEN,? ?DS|^DS\b|^DS AUTOMOBILES/, 'DS'], [/^CITROEN/, 'Citroën'], [/^PEUGEOT/, 'Peugeot'],
  [/^RENAULT/, 'Renault'], [/^DACIA/, 'Dacia'], [/^ALPINE/, 'Alpine'],
  [/^FIAT/, 'Fiat'], [/^ABARTH/, 'Abarth'], [/^ALFA/, 'Alfa Romeo'], [/^LANCIA/, 'Lancia'], [/^JEEP/, 'Jeep'],
  [/^TOYOTA/, 'Toyota'], [/^LEXUS/, 'Lexus'], [/^HONDA/, 'Honda'], [/^MAZDA/, 'Mazda'], [/^NISSAN/, 'Nissan'],
  [/^MITSUBISHI/, 'Mitsubishi'], [/^SUZUKI/, 'Suzuki'], [/^SUBARU/, 'Subaru'], [/^DAIHATSU/, 'Daihatsu'],
  [/^HYUNDAI(,|\.)? ?GENESIS|^GENESIS/, 'Genesis'], [/^HYUNDAI/, 'Hyundai'], [/^KIA/, 'Kia'], [/^SSANGYONG|^KGM/, 'SsangYong'],
  [/^VOLVO/, 'Volvo'], [/^POLESTAR/, 'Polestar'], [/^SAAB/, 'Saab'],
  [/^LAND ?ROVER|^JAGUAR LAND ROVER/, 'Land Rover'], [/^JAGUAR/, 'Jaguar'],
  [/^MG\b/, 'MG'], [/^BYD/, 'BYD'], [/^TESLA/, 'Tesla'], [/^LADA|^AVTOVAZ/, 'Lada'],
  [/^CHEVROLET/, 'Chevrolet'], [/^CHRYSLER/, 'Chrysler'], [/^DODGE/, 'Dodge'], [/^CADILLAC/, 'Cadillac'],
  [/^INFINITI/, 'Infiniti'], [/^LYNK/, 'Lynk & Co'], [/^GREAT WALL|^ORA\b|^WEY\b/, 'Great Wall'],
  [/^ROLLS/, 'Rolls-Royce'], [/LAMBORGHINI/, 'Lamborghini'], [/^FERRARI/, 'Ferrari'], [/^MASERATI/, 'Maserati'],
  [/^BENTLEY/, 'Bentley'], [/^ASTON/, 'Aston Martin'], [/^MCLAREN/, 'McLaren'], [/^LOTUS/, 'Lotus'],
  [/^MORGAN/, 'Morgan'], [/^INEOS/, 'Ineos'], [/^DFSK/, 'DFSK'], [/^SWM/, 'SWM'],
];

export function normalizeMake(raw) {
  const value = clean(raw);
  if (!value || value === 'UNKNOWN' || value === 'AA-IVA') return null;
  for (const [pattern, name] of MAKE_RULES) if (pattern.test(value)) return name;
  return null; // unbekannte Kleinserien bleiben außen vor
}

const MAKE_PREFIX = /^(VOLKSWAGEN|VW|MERCEDES-BENZ|MERCEDES|BMW|AUDI|SKODA|SEAT|CUPRA|PORSCHE|OPEL|FORD|CITROEN|PEUGEOT|RENAULT|DACIA|FIAT|ABARTH|ALFA ROMEO|TOYOTA|LEXUS|HONDA|MAZDA|NISSAN|MITSUBISHI|SUZUKI|SUBARU|HYUNDAI|KIA|VOLVO|JEEP|MINI|SMART|DS|MG|JAGUAR|LAND ROVER|LANCIA)\s+/;

function mercedes(model) {
  const m = model.replace(/^(MERCEDES-AMG|AMG)\s+/, '');
  const first = m.split(/[\s-]/)[0];
  if (/^(A|B|C|E|S|G|V|X|R|T)$/.test(first) || /^(A|B|C|E|S|G|V|X|R|T)\d/.test(first)) return `${first[0]}-KLASSE`;
  if (/^(CLA|CLE|CLS|CLK|CLC|GLA|GLB|GLC|GLE|GLK|GLS|GL|ML|SL|SLC|SLK|SLS|CL|EQA|EQB|EQC|EQE|EQS|EQV|EQT|CITAN|VITO|SPRINTER|MARCO)/.test(first)) {
    const family = first.match(/^(CLA|CLE|CLS|CLK|CLC|GLA|GLB|GLC|GLE|GLK|GLS|GL|ML|SLC|SLK|SLS|SL|CL|EQA|EQB|EQC|EQE|EQS|EQV|EQT|CITAN|VITO|SPRINTER|MARCO)/)[1];
    return family === 'MARCO' ? 'MARCO POLO' : family;
  }
  if (/-KLASSE$/.test(m)) return m;
  return first;
}

function bmw(model) {
  const first = model.split(' ')[0];
  const series = first.match(/^M?(\d)\d\d[A-Z]*$/); // 118I, 320D, M135I → Baureihe
  if (series) return `${series[1]}ER`;
  if (/^(\d)ER/.test(first)) return `${first[0]}ER`;
  const x = first.match(/^(X\d|Z\d|I\d|IX\d?|M\d)/);
  return x ? x[1] : first;
}

export function normalizeModel(raw, make, fuel) {
  let model = clean(raw).replace(/[“”"]/g, '').replace(/\s*[,.]\s*/g, ' ').trim();
  if (!model) return null;
  for (let i = 0; i < 2; i++) model = model.replace(MAKE_PREFIX, '');
  model = model
    .replace(/\s+(FULL |SELF-CHARGING |VOLL)?HYBRID( SYNERGY DRIVE)?$/, '')
    .replace(/\s+E-TECH( FULL)?( HYBRID)?$/, '')
    .replace(/\s+(TSI|TDI|TFSI|BLUEMOTION|BLUEHDI|CDTI|ECOBOOST|DCI|HDI)$/, '')
    .trim();
  if (make === 'Opel' && /^CORSA-E/.test(model) && fuel !== 'electric') model = 'CORSA';
  if (make === 'Volkswagen' && /^UP(UE|!)?$/.test(model)) model = 'UP!';
  if (make === 'Mazda') { model = model.replace(/^MAZDA\s*/, ''); if (/^\d$/.test(model)) model = `MAZDA${model}`; }
  if (make === 'Mercedes-Benz') model = mercedes(model);
  if (make === 'BMW') model = bmw(model);
  model = model
    .replace(/\s+OR\s+\w+$|\s+MORNING$/, '')            // Kia: "PICANTO OR MORNING", "CARENS OR RONDO"
    .replace(/^(KONA( N)?) KAUAI( N)?$/, '$1').replace(/^TUCSON,? IX35$/, 'TUCSON').replace(/^I (\d\d)/, 'I$1')
    .replace(/^(\S+) \1\b/, '$1').replace(/^SPORTAGE( SL SLS|SLSLS)$/, 'SPORTAGE').replace(/^KONA N KAUAI N$/, 'KONA N').replace(/^TUCSONIX35LM$/, 'TUCSON').replace(/^PICANTOSA$/, 'PICANTO')
    .replace(/\bSB$/, 'SPORTBACK').replace(/\s*\(.*\)$/, '');
  if (/REIHE$|^COOPER$|^-$|^\?+$/.test(model)) return null; // Sammelbezeichnungen ohne eindeutiges Modell
  return model || null;
}

// Vergleichsschlüssel: 2011/2012 schreibt die EEA Modelle teils ohne Leerzeichen und mit Marke ("AUDIA3SPORTBACK").
const COMPACT_MAKES = ['VOLKSWAGEN', 'VW', 'MERCEDESBENZ', 'MERCEDES', 'TOYOTA', 'AUDI', 'OPEL', 'FORD', 'SKODA', 'SEAT', 'RENAULT', 'PEUGEOT', 'CITROEN', 'FIAT', 'HYUNDAI', 'KIA', 'MAZDA', 'NISSAN', 'HONDA', 'SUZUKI', 'DACIA', 'VOLVO', 'BMW', 'MINI', 'DAIHATSU'];
export function startsWithMake(model) { const k = model.replace(/[^A-Z0-9]/g, ''); return COMPACT_MAKES.some(m => k.startsWith(m) && k.length > m.length + 1); }
export function modelKey(model) {
  let key = model.replace(/[^A-Z0-9+!]/g, '').replace(/HYBRID$/, '');
  for (const make of COMPACT_MAKES) if (key.startsWith(make) && key.length > make.length + 1) { key = key.slice(make.length); break; }
  return key;
}

// Antrieb: nur Benzin, Diesel und Hybride ohne Stecker, weil der Rechner Kraftstoffkosten rechnet.
export function normalizeDrive(ft, fm, co2) {
  const fuel = clean(ft), mode = clean(fm);
  if (mode === 'P' || mode === 'E' || mode === 'B' || mode === 'F') return null; // Plug-in, elektrisch, Gas, Flex
  if (fuel === 'PETROL') return { fuel: 'B', hybrid: mode === 'H' };
  if (fuel === 'DIESEL') return { fuel: 'D', hybrid: mode === 'H' };
  // Ältere Jahre kennen nur "petrol/electric": Unter 70 g CO₂ handelt es sich praktisch immer um Plug-in-Hybride.
  if (/^PETROL[-/]ELECTRIC$/.test(fuel)) return co2 >= 70 ? { fuel: 'B', hybrid: true } : null;
  if (/^DIESEL[-/]ELECTRIC$/.test(fuel)) return co2 >= 70 ? { fuel: 'D', hybrid: true } : null;
  return null;
}

const titleCase = value => value.toLowerCase().replace(/(^|[\s/+-])([a-zäöü])/g, (_, p, c) => p + c.toUpperCase());
const KEEP_UPPER = /\b(Gti|Gtd|Gte|Tsi|Tdi|Suv|Rs|Gt|Amg|Cr-V|Hr-V|Cx-\d+|Mx-\d+|Rav4|Ds|Mg|Id|Gr|St|Xc\d+|V\d+|S\d+|Q\d+|A\d+|X\d+|Z\d+|Ix\d*|I\d+|Eq[a-z]?|Cla|Cls|Clk|Gla|Glb|Glc|Gle|Gls|Glk|Gl|Ml|Sl|Slk|Slc|C-Hr|Ux|Nx|Rx|Is|Ls|Es|Up!|Mii)\b/g;
export function displayModel(model, make) {
  if (make === 'BMW' && /^\dER$/.test(model)) return `${model[0]}er`;
  if (make === 'Mercedes-Benz' && /-KLASSE$/.test(model)) return `${model[0]}-Klasse`;
  let value = titleCase(model).replace(KEEP_UPPER, m => m.toUpperCase());
  if (make === 'BMW') value = value.replace(/^I(\d)/, 'i$1').replace(/^IX/, 'iX');
  if (make === 'MG') value = value.replace(/^Mg(\d)/, 'MG$1');
  if (make === 'Hyundai') value = value.replace(/^I(\d)/, 'i$1').replace(/^IX(\d)/i, 'ix$1').replace(/^Tucson IX35/i, 'Tucson');
  return value.replace(/\bUP!/, 'up!').replace(/\bMII\b/, 'Mii');
}
