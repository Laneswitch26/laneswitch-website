// Fahrzeugkosten-Check · Bedienung. Daten: daten/index.json (Übersicht) und je Hersteller eine Datei, die erst bei Bedarf geladen wird.
import { toVariant, ps, buildSearchIndex, searchModels, taxRule, TAX_RULE_NAMES, monthly, FUEL_PRICES } from './rechnen.mjs?v=1';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = value => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const euro = n => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const num = (n, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

let index = null, entries = [], step = 1, selected = null, latestRequest = null;
const makeCache = new Map();
const state = { makeId: '', model: '', year: 0 };

const search = $('#vehicleSearch'), list = $('#vehicleSuggest'), makeSelect = $('#makeSelect'), modelSelect = $('#modelSelect'), yearSelect = $('#yearSelect'), variantList = $('#variantList');

async function loadIndex() {
  const response = await fetch('daten/index.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('index');
  return response.json();
}
async function loadMake(id) {
  if (makeCache.has(id)) return makeCache.get(id);
  const make = index.marken.find(m => m.id === id);
  const promise = fetch(`daten/${id}.json?v=${make.v}`).then(r => { if (!r.ok) throw new Error(id); return r.json(); });
  makeCache.set(id, promise);
  promise.catch(() => makeCache.delete(id));
  return promise;
}

// ---------- Suche mit Vorschlagsliste ----------
let suggestions = [], active = -1;
function renderSuggestions() {
  const query = search.value.trim();
  suggestions = query.length >= 1 ? searchModels(entries, query) : [];
  active = suggestions.length ? 0 : -1;
  if (!query) { closeSuggestions(); return; }
  list.innerHTML = suggestions.length
    ? suggestions.map((s, i) => `<li role="option" id="fkOpt${i}" aria-selected="${i === active}" data-index="${i}"><strong>${esc(s.make)} ${esc(s.model)}</strong><span>${s.year ? `Baujahr ${s.year}` : s.from === s.to ? `Baujahr ${s.from}` : `Baujahre ${s.from} bis ${s.to}`}</span></li>`).join('')
    : '<li class="empty" role="option" aria-disabled="true">Kein passendes Modell gefunden. Versuche es mit Hersteller und Modell, z. B. „Opel Corsa“.</li>';
  list.hidden = false;
  search.setAttribute('aria-expanded', 'true');
  search.setAttribute('aria-activedescendant', active >= 0 ? `fkOpt${active}` : '');
}
function closeSuggestions() { list.hidden = true; search.setAttribute('aria-expanded', 'false'); search.removeAttribute('aria-activedescendant'); }
function highlight(i) {
  active = (i + suggestions.length) % suggestions.length;
  $$('#vehicleSuggest [role=option]').forEach((li, k) => li.setAttribute('aria-selected', String(k === active)));
  search.setAttribute('aria-activedescendant', `fkOpt${active}`);
  $(`#fkOpt${active}`)?.scrollIntoView({ block: 'nearest' });
}
search.addEventListener('input', renderSuggestions);
search.addEventListener('focus', () => { if (search.value.trim()) renderSuggestions(); });
search.addEventListener('keydown', event => {
  if (list.hidden || !suggestions.length) { if (event.key === 'ArrowDown' && search.value.trim()) renderSuggestions(); return; }
  if (event.key === 'ArrowDown') { event.preventDefault(); highlight(active + 1); }
  else if (event.key === 'ArrowUp') { event.preventDefault(); highlight(active - 1); }
  else if (event.key === 'Enter') { event.preventDefault(); pickSuggestion(suggestions[active]); }
  else if (event.key === 'Escape') { closeSuggestions(); }
});
list.addEventListener('pointerdown', event => event.preventDefault()); // Fokus im Suchfeld halten
list.addEventListener('click', event => { const li = event.target.closest('[data-index]'); if (li) pickSuggestion(suggestions[+li.dataset.index]); });
document.addEventListener('click', event => { if (!event.target.closest('.fk-search')) closeSuggestions(); });

function pickSuggestion(s) {
  if (!s) return;
  closeSuggestions();
  search.value = `${s.make} ${s.model}${s.year ? ` ${s.year}` : ''}`;
  choose(s.makeId, s.model, s.year || 0, null, { focus: 'year' });
}

// ---------- Auswahl Hersteller → Modell → Baujahr → Variante ----------
function fillMakes() {
  makeSelect.replaceChildren(new Option('Hersteller wählen', ''));
  for (const make of index.marken) makeSelect.add(new Option(make.name, make.id));
}
function fillModels() {
  const make = index.marken.find(m => m.id === state.makeId);
  modelSelect.replaceChildren(new Option(make ? 'Modell wählen' : 'Erst Hersteller wählen', ''));
  modelSelect.disabled = !make;
  if (make) for (const [name, from, to] of make.modelle) modelSelect.add(new Option(`${name} (${from === to ? from : `${from}–${to}`})`, name));
  modelSelect.value = state.model;
}
async function fillYears() {
  yearSelect.replaceChildren(new Option(state.model ? 'Baujahr wählen' : 'Erst Modell wählen', ''));
  yearSelect.disabled = true;
  if (!state.model) return [];
  const data = await loadMake(state.makeId);
  const variants = data.modelle[state.model] || [];
  const years = [...new Set(variants.map(v => v[0]))].sort((a, b) => b - a);
  for (const y of years) yearSelect.add(new Option(String(y), y));
  yearSelect.disabled = false;
  return years;
}
async function renderVariants(preferred) {
  if (!state.year) { variantList.innerHTML = ''; $('#variantField').hidden = true; setSelected(null); return; }
  const data = await loadMake(state.makeId);
  const make = index.marken.find(m => m.id === state.makeId).name;
  const variants = (data.modelle[state.model] || []).filter(v => v[0] === state.year).map(v => toVariant(v, make, state.model)).sort((a, b) => b.registrations - a.registrations);
  $('#variantField').hidden = false;
  $('#variantCount').textContent = variants.length === 1 ? '1 Motorisierung' : `${variants.length} Motorisierungen`;
  const SHOW = 4;
  variantList.innerHTML = variants.map((v, i) => `<div class="choice variant"${i >= SHOW ? ' hidden' : ''}><input type="radio" name="variant" id="variant${i}" value="${i}"><label for="variant${i}"><strong>${v.kw} kW (${ps(v.kw)} PS) · ${esc(v.drive)}</strong><span>${num(v.cc)} cm³ · ${num(v.consumption, 1)} l/100 km (${v.cycle === 'W' ? 'WLTP' : 'NEFZ'})${i === 0 && variants.length > 1 ? ' · am häufigsten zugelassen' : ''}</span></label></div>`).join('');
  if (variants.length > SHOW) {
    variantList.insertAdjacentHTML('beforeend', `<button type="button" class="variant-more">Alle ${variants.length} Motorisierungen anzeigen</button>`);
    variantList.querySelector('.variant-more').onclick = e => { variantList.querySelectorAll('.variant[hidden]').forEach(el => { el.hidden = false; }); e.currentTarget.remove(); };
  }
  const pick = preferred ? Math.max(0, variants.findIndex(v => v.kw === preferred.kw && v.cc === preferred.cc && v.fuelCode === preferred.fuelCode && v.hybrid === preferred.hybrid)) : 0;
  const input = $(`#variant${pick}`); if (input) { input.checked = true; input.closest('.variant').hidden = false; }
  variantList.onchange = () => setSelected(variants[+$('input[name=variant]:checked').value]);
  setSelected(variants[pick] || null);
}

async function choose(makeId, model, year, preferred, { focus } = {}) {
  state.makeId = makeId; state.model = model; state.year = 0;
  makeSelect.value = makeId; fillModels();
  try {
    const years = await fillYears();
    if (year && years.includes(year)) state.year = year;
    else if (preferred) state.year = preferred.year;
    yearSelect.value = state.year ? String(state.year) : '';
    await renderVariants(preferred);
    if (!state.year && focus === 'year') yearSelect.focus();
  } catch { showLoadError(); }
}

makeSelect.addEventListener('change', () => { state.makeId = makeSelect.value; state.model = ''; state.year = 0; fillModels(); fillYears(); renderVariants(); });
modelSelect.addEventListener('change', async () => { state.model = modelSelect.value; state.year = 0; try { await fillYears(); } catch { showLoadError(); } renderVariants(); });
yearSelect.addEventListener('change', () => { state.year = +yearSelect.value || 0; renderVariants().catch(showLoadError); });
$('#resetFilters').addEventListener('click', () => { search.value = ''; closeSuggestions(); state.makeId = ''; state.model = ''; state.year = 0; makeSelect.value = ''; fillModels(); fillYears(); renderVariants(); search.focus(); });

function showLoadError() { $('#vehicleCount').textContent = 'Die Fahrzeugdaten konnten nicht geladen werden. Bitte prüfe die Verbindung und lade die Seite neu.'; }

function setSelected(v) {
  selected = v;
  $('[data-step="1"] .next').disabled = !selected;
  const card = $('#vehicleCard');
  if (!selected) { card.innerHTML = '<span class="badge">Noch kein Fahrzeug</span><h3>Deine Auswahl</h3><p>Nach der Auswahl erscheinen hier Verbrauch, Leistung, Steuerregel und technische Eckdaten.</p>'; return; }
  card.innerHTML = `<span class="badge">Ausgewählt</span><h3>${esc(v.make)} ${esc(v.model)}</h3><p>Baujahr ${v.year} · ${esc(v.drive)}</p><div class="vehicle-data"><div><strong>${num(v.consumption, 1)} l</strong><span>${v.cycle === 'W' ? 'WLTP' : 'NEFZ'} / 100 km</span></div><div><strong>${v.kw} kW</strong><span>${ps(v.kw)} PS</span></div><div><strong>${num(v.cc)} cm³</strong><span>Hubraum</span></div><div><strong>${num(v.co2)} g</strong><span>CO₂ / km</span></div><div><strong>${num(v.registrations)}</strong><span>Erstzulassungen in Deutschland ${v.year}</span></div></div>${v.cycle === 'N' ? '<p class="hint">Ältere Fahrzeuge wurden nach dem NEFZ gemessen. Der Rechner gleicht das an das realistischere WLTP-Niveau an.</p>' : ''}`;
  $('#fuelPrice').value = FUEL_PRICES[v.fuel].toFixed(2);
  $('#fuelHint').textContent = `Voreinstellung ${v.fuel === 'Diesel' ? 'Diesel' : 'E10'}; frei anpassbar.`;
}

// ---------- Orientierung: Budgetstufen ----------
function recCard(item, rec) {
  const v = toVariant(item.variante, item.hersteller, item.name);
  const c = monthly(v);
  const years = rec === 'neu' ? `Neuwagen · Baujahr ${v.year} in den Daten` : `Baujahre ${item.baujahre[0]} bis ${item.baujahre[1]}`;
  return `<button type="button" class="fk-rec" data-rec='${esc(JSON.stringify({ id: item.id, model: item.name, v: item.variante }))}'><span><strong>${esc(item.hersteller)} ${esc(item.name)}</strong><small>${esc(years)}${item.preis ? ` · ${esc(item.preis)}` : ''}</small><small class="why">${esc(item.grund)}</small></span><span class="rec-cost">${euro(c.low)} bis ${euro(c.high)} / Monat<small>Beispiel: ${v.kw} kW · ${esc(v.drive)} · ${v.year}</small></span></button>`;
}
function renderRecommendations() {
  const tabs = $('#recTabs'), panels = $('#recPanels');
  const rec = index.empfehlungen;
  const groups = [];
  if (rec) for (const tier of rec.stufen) groups.push({ id: tier.id, label: tier.kurz, title: tier.titel, text: tier.text, html: tier.fahrzeuge.map(f => recCard(f, tier.id)).join('') });
  groups.push({ id: 'beliebt', label: 'Häufig zugelassen', title: `Häufig neu zugelassen (${index.jahre[1]})`, text: `Die meistzugelassenen Varianten in Deutschland im Jahr ${index.jahre[1]} laut EEA-Daten. Das ist der gesamte Neuwagenmarkt, nicht speziell für Fahranfänger:innen.`, html: index.beliebt.map(b => recCard({ ...b, name: b.name, grund: `${num(b.variante[8])} Erstzulassungen dieser Variante ${b.variante[0]}.` }, 'neu')).join('') });
  tabs.innerHTML = groups.map((g, i) => `<button type="button" role="tab" id="recTab-${g.id}" aria-controls="recPanel-${g.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${esc(g.label)}</button>`).join('');
  panels.innerHTML = groups.map((g, i) => `<section role="tabpanel" id="recPanel-${g.id}" aria-labelledby="recTab-${g.id}" ${i ? 'hidden' : ''}><h3>${esc(g.title)}</h3><p class="ranking-note">${esc(g.text)}</p><div class="ranking-list">${g.html}</div></section>`).join('');
  const select = tab => { $$('#recTabs [role=tab]').forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; $(`#${t.getAttribute('aria-controls')}`).hidden = !on; }); };
  tabs.addEventListener('click', e => { const t = e.target.closest('[role=tab]'); if (t) select(t); });
  tabs.addEventListener('keydown', e => {
    const all = $$('#recTabs [role=tab]'), i = all.indexOf(document.activeElement);
    if (i < 0 || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length;
    all[next].focus(); select(all[next]);
  });
  panels.addEventListener('click', async e => {
    const card = e.target.closest('[data-rec]'); if (!card) return;
    const { id, model, v } = JSON.parse(card.dataset.rec);
    const make = index.marken.find(m => m.id === id).name;
    search.value = '';
    await choose(id, model, v[0], toVariant(v, make, model));
    $('#vehicleCard').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
  if (rec) {
    $('#recSources').innerHTML = `${esc(rec.hinweis)} Stand der Auswahl: ${new Date(rec.stand).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}. Quellen: ${rec.quellen.map(q => `<a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.titel)}</a>`).join(' · ')}. Monatskosten jeweils für das Musterprofil unten.`;
  }
}

// ---------- Schritte und Ergebnis ----------
function showStep(n) {
  step = n;
  $$('.step').forEach(x => x.classList.toggle('active', +x.dataset.step === n));
  $$('.progress i').forEach((x, i) => x.classList.toggle('active', i < n));
  $('#stepLabel').textContent = `Schritt ${n} von 4 · ${['Fahrzeug', 'Nutzung', 'Absicherung', 'Ergebnis'][n - 1]}`;
  $('#calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (n === 4) calculate();
}
$$('.next').forEach(b => b.addEventListener('click', () => showStep(Math.min(4, step + 1))));
$$('.back').forEach(b => b.addEventListener('click', () => showStep(Math.max(1, step - 1))));

function calculate() {
  if (!selected) return;
  const km = Math.max(1000, Math.min(50000, +$('#km').value || 12000));
  const price = Math.max(.5, Math.min(4, +$('#fuelPrice').value || 2));
  const route = $('input[name="route"]:checked').value;
  const cover = $('input[name="cover"]:checked').value;
  const age = Math.max(17, +$('#age').value || 18);
  const license = $('#licenseYears').value;
  const c = monthly(selected, { km, price, route, age, license, cover });
  const rule = TAX_RULE_NAMES[taxRule(selected.year)];
  latestRequest = { km, cover, low: c.low, high: c.high, year: selected.year };
  $('#resultTitle').textContent = `${selected.make} ${selected.model}, Baujahr ${selected.year} · ${num(km)} km pro Jahr`;
  $('#total').innerHTML = `${euro(c.low)} bis ${euro(c.high)} <span>/ Monat</span>`;
  $('#insurance').textContent = `${euro(c.ins[0])} bis ${euro(c.ins[1])}`;
  $('#fuelCost').textContent = euro(c.fuel);
  $('#tax').textContent = euro(c.tax);
  $('#taxAssumption').textContent = `Näherung nach der Regel für ${rule}`;
  $('#maintenance').textContent = euro(c.reserve);
  $('#maintenanceText').textContent = new Date().getFullYear() - selected.year > 5 ? 'Wartung, Reifen, HU/AU und Verschleiß, mit Aufschlag für das Fahrzeugalter' : 'Orientierung für Wartung, Reifen, HU/AU und Verschleiß';
  $('#consumptionText').textContent = `${num(c.litres, 1)} l/100 km angesetzter Alltag · ${price.toFixed(2).replace('.', ',')} €/l`;
}

// ---------- Anfrage per E-Mail ----------
const requestDialog = $('#kfzRequestDialog'), requestForm = $('#kfzRequestForm');
requestForm.elements.requestBirthDate.max = new Date().toISOString().slice(0, 10);
$('#contact').addEventListener('click', () => { if (latestRequest) requestDialog.showModal(); });
$('#closeKfzRequest').addEventListener('click', () => requestDialog.close());
$('#cancelKfzRequest').addEventListener('click', () => requestDialog.close());
requestDialog.addEventListener('click', event => { if (event.target === requestDialog) requestDialog.close(); });
requestForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!requestForm.reportValidity() || !selected || !latestRequest) return;
  const data = new FormData(requestForm);
  const coverName = { liability: 'Haftpflicht', partial: 'Teilkasko', full: 'Vollkasko' }[latestRequest.cover];
  const birthDate = String(data.get('requestBirthDate') || '').split('-').reverse().join('.');
  const subject = `Kfz-Versicherungsanfrage: ${selected.make} ${selected.model}`;
  const lines = ['Hallo Herr Dragojevic,', '', 'ich möchte die Kfz-Versicherung für folgendes Fahrzeug individuell prüfen lassen:', '', `Name: ${data.get('requestName') || ''}`, `Rufnummer: ${data.get('requestPhone') || 'nicht angegeben'}`, `PLZ des Wohnortes: ${data.get('requestPostalCode') || ''}`, `Geburtsdatum: ${birthDate}`, `Voraussichtliche SF-Klasse: ${data.get('requestSfClass') || 'Nicht bekannt'}`, '', `Fahrzeug: ${selected.make} ${selected.model}`, `Baujahr (Erstzulassung): ${latestRequest.year}`, `Motorisierung: ${selected.kw} kW (${ps(selected.kw)} PS), ${selected.drive}, ${selected.cc} cm³`, `Fahrleistung: ${latestRequest.km} km/Jahr`, `Gewünschter Schutz: ${coverName}`, `Orientierung aus dem Rechner: ${euro(latestRequest.low)} bis ${euro(latestRequest.high)} monatlich`, '', 'Bitte melden Sie sich bei mir.'];
  requestDialog.close();
  window.location.href = `mailto:kontakt@laneswitch.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
});
$('#compare').addEventListener('click', () => showStep(1));
$('#restart').addEventListener('click', () => location.reload());

// ---------- Start ----------
(async () => {
  try { index = await loadIndex(); }
  catch { showLoadError(); return; }
  entries = buildSearchIndex(index);
  const models = index.marken.reduce((s, m) => s + m.modelle.length, 0);
  $('#vehicleCount').textContent = `${num(models)} Modelle von ${index.marken.length} Herstellern, Baujahre ${index.jahre[0]} bis ${index.jahre[1]}`;
  $$('[data-fact=models]').forEach(el => { el.textContent = num(models); });
  $$('[data-fact=years]').forEach(el => { el.textContent = `${index.jahre[0]}–${index.jahre[1]}`; });
  $$('[data-fact=firstyear]').forEach(el => { el.textContent = String(index.jahre[0]); });
  $$('[data-fact=lastyear]').forEach(el => { el.textContent = String(index.jahre[1]); });
  $$('[data-fact=provisional]').forEach(el => { const p = index.vorlaeufig; el.textContent = !p.length ? '' : p.length === 1 ? ` Das Jahr ${p[0]} ist noch vorläufig.` : ` Die Jahre ${p.join(' und ')} sind noch vorläufig.`; });
  fillMakes(); fillModels(); fillYears();
  search.disabled = false; makeSelect.disabled = false;
  renderRecommendations();
})();
