// Gefahrenradar: Trefferlogik mit Videospuren und Vollständigkeit der vorgerenderten Videos.
// Aufruf: node --test qa/gefahrenradar.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../dist/konzept/lernwelt/gefahrenradar');
const { SCENES } = await import(path.join(dir, 'scenes.mjs'));
const { hazardAt, isHit, trackAreas } = await import(path.join(dir, 'core.mjs'));
const { VIDEO_TRACKS } = await import(path.join(dir, 'video-tracks.mjs'));
const { attachTrack, detachTrack } = await import(path.join(dir, 'video.mjs'));

const base = { id: 'x', cueMs: 1000, durationMs: 11000, motionMs: 6500, hazard: { from: [100, 100], to: [200, 100], rx: 70, ry: 70 } };

test('ohne Spur bleibt die bisherige Bewegung von „from“ nach „to“ unverändert', () => {
  const at = hazardAt(base, 1000 + 3250);
  assert.equal(Math.round(at.x), 150); assert.equal(at.y, 100);
  assert.equal(isHit(base, 999, 100, 100), false);
  assert.equal(isHit(base, 1000, 100, 100), true);
  assert.equal(isHit(base, 11000, 200, 100), false);
});

test('mit Spur werden Position und Bereich zwischen den Stützstellen interpoliert', () => {
  const scene = { ...base, track: { step: 100, areas: [[100, 100, 70, 70], [200, 100, 70, 70], []] }, trackOffset: 0 };
  const at = hazardAt(scene, 50);
  assert.equal(at.x, 150);
  assert.deepEqual(trackAreas(scene, 50), [{ x: 150, y: 100, rx: 70, ry: 70 }]);
  // Leere Stützstelle: kein Treffer möglich, Markierung wird ausgeblendet.
  assert.deepEqual(trackAreas(scene, 200), []);
  assert.equal(hazardAt(scene, 200).x, -999);
});

test('mehrere Gefahrenbereiche zählen alle als Treffer und der Versatz verschiebt die Spur', () => {
  const scene = { ...base, cueMs: 0, track: { step: 100, areas: [[100, 100, 60, 60, 600, 300, 60, 60], [100, 100, 60, 60, 600, 300, 60, 60]] }, trackOffset: 0 };
  assert.equal(isHit(scene, 0, 600, 300), true);
  assert.equal(isHit(scene, 0, 400, 400), false);
  const shifted = { ...base, track: { step: 100, areas: [[0, 0, 60, 60], [0, 0, 60, 60], [500, 200, 60, 60]] }, trackOffset: 200 };
  assert.equal(isHit(shifted, 999, 500, 200), false); // vor dem Gefahren-Zeitpunkt nie
  assert.equal(isHit(shifted, 1000, 500, 200), true);
  assert.equal(trackAreas(shifted, 0)[0].x, 500);
});

test('Mindestgröße von 56 CSS-Pixeln gilt auch für Videobereiche', () => {
  const scene = { ...base, cueMs: 0, track: { step: 100, areas: [[400, 280, 5, 5]] }, trackOffset: 0 };
  // Auf einer 400 px breiten Bühne entsprechen 28 CSS-Pixel 56 Einheiten.
  assert.equal(isHit(scene, 0, 450, 280, 400), true);
  assert.equal(isHit(scene, 0, 470, 280, 400), false);
});

test('der zufällige Gefahren-Zeitpunkt wird über den Videostart ausgeglichen', () => {
  for (const s of SCENES) {
    const t = VIDEO_TRACKS[s.id]; if (!t) continue;
    for (const jitter of [-350, 0, 350]) {
      const round = attachTrack({ ...s, cueMs: s.cueMs === 0 ? 0 : s.cueMs + jitter });
      assert.ok(round.trackOffset >= 0, s.id);
      assert.ok(round.trackOffset + round.durationMs <= t.len, `${s.id}: Video zu kurz`);
      if (s.cueMs > 0) assert.equal(round.cueMs + round.trackOffset, t.cue, `${s.id}: Gefahr im Video nicht synchron`);
      detachTrack(round); assert.equal(round.track, undefined);
    }
  }
});

test('alle Szenen haben Video, Standbild und eine plausible Gefahrenspur', () => {
  assert.ok(Object.keys(VIDEO_TRACKS).length > 0, 'keine Videospuren erzeugt');
  assert.ok(existsSync(path.join(dir, 'video/preview.jpg')), 'Vorschaubild fehlt');
  for (const s of SCENES) {
    const t = VIDEO_TRACKS[s.id];
    assert.ok(t, `${s.id}: Spur fehlt`);
    assert.equal(t.cue, s.cueMs > 0 ? s.cueMs + 350 : 0, s.id);
    assert.equal(t.len, s.durationMs + (s.cueMs > 0 ? 700 : 0), s.id);
    assert.equal(t.areas.length, Math.floor(t.len / t.step) + 1, s.id);
    for (const ext of ['mp4', 'jpg']) assert.ok(existsSync(path.join(dir, `video/${s.id}.${ext}`)), `${s.id}.${ext} fehlt`);
    assert.ok(statSync(path.join(dir, `video/${s.id}.mp4`)).size < 1.6e6, `${s.id}.mp4 zu groß`);
    // Zwischen Gefahren-Zeitpunkt und Szenenende muss die Gefahr fast immer im Bild und antippbar sein.
    const from = t.cue / t.step, to = (t.cue + s.durationMs - Math.max(0, s.cueMs)) / t.step;
    let visible = 0, total = 0;
    for (let i = Math.ceil(from); i <= Math.min(t.areas.length - 1, Math.floor(to)); i++) {
      total++; const a = t.areas[i];
      if (a.length >= 4 && a[0] > -40 && a[0] < 840 && a[1] > -40 && a[1] < 600) visible++;
    }
    assert.ok(visible / total >= 0.85, `${s.id}: Gefahr nur ${Math.round(visible / total * 100)} % sichtbar`);
  }
});
