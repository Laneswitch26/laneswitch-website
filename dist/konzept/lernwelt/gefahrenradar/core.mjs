import { RULES, BADGES } from './scenes.mjs?v=5';
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
// Video-Szenen: Gefahrenbereiche liegen als Spur (alle `step` ms) vor, weil sich die Kamera bewegt.
// `trackOffset` verschiebt die Spur, wenn der Gefahren-Zeitpunkt der Runde zufällig variiert.
export function trackAreas(scene, elapsed) {
  const t = scene.track; if (!t) return null;
  const pos = (elapsed + (scene.trackOffset || 0)) / t.step, i = Math.max(0, Math.min(t.areas.length - 1, Math.floor(pos)));
  const a = t.areas[i], b = t.areas[Math.min(t.areas.length - 1, i + 1)], u = Math.max(0, Math.min(1, pos - i));
  const out = [];
  for (let k = 0; k + 3 < a.length; k += 4) {
    const mix = j => b.length === a.length ? a[k + j] + (b[k + j] - a[k + j]) * u : a[k + j];
    out.push({ x: mix(0), y: mix(1), rx: mix(2), ry: mix(3) });
  }
  return out;
}
export function hazardAt(scene, elapsed) {
  const progress = Math.max(0, Math.min(1, (elapsed - scene.cueMs) / scene.motionMs));
  const areas = trackAreas(scene, elapsed);
  if (areas) return areas.length ? { x: areas[0].x, y: areas[0].y, progress, areas } : { x: -999, y: -999, progress, areas };
  return { x: scene.hazard.from[0] + (scene.hazard.to[0] - scene.hazard.from[0]) * progress,
    y: scene.hazard.from[1] + (scene.hazard.to[1] - scene.hazard.from[1]) * progress, progress };
}
export function isHit(scene, elapsed, x, y, width = 800) {
  if (elapsed < scene.cueMs || elapsed >= scene.durationMs) return false;
  const position = hazardAt(scene, elapsed);
  // Minimum target diameter of 56 CSS pixels, in the same SVG coordinate system.
  const minRadius = 28 * 800 / Math.max(width, 1);
  const areas = position.areas || [{...position,rx:scene.hazard.rx,ry:scene.hazard.ry}, ...(scene.hazard.also || [])];
  return areas.some(area =>
    ((x - area.x) / Math.max(area.rx, minRadius)) ** 2 +
    ((y - area.y) / Math.max(area.ry, minRadius)) ** 2 <= 1);
}
export function scoreScene(record) {
  return Math.max(0, (record.detected ? RULES.detected : 0) +
    (record.detected && record.early ? RULES.early : 0) +
    (record.correct ? RULES.correct : 0) - Math.min(record.misclicks, RULES.maxPenalty) * RULES.misclick);
}
export function summarize(records) {
  const result = { points: records.reduce((total, item) => total + scoreScene(item), 0),
    detected: records.filter(item => item.detected).length,
    correct: records.filter(item => item.correct).length,
    missed: records.filter(item => !item.detected).length,
    early: records.filter(item => item.early).length,
    penalty: records.reduce((total, item) => total + Math.min(item.misclicks, RULES.maxPenalty), 0) };
  result.badge = BADGES.find(badge => result.points >= badge.minPoints && result.detected >= badge.minDetected && result.correct >= badge.minCorrect) || null;
  return result;
}

// A session-local bag: consume only scenes actually displayed, never a whole reserved round.
// Across bag boundaries, put the recent window at the back of the next shuffled bag.
export function createSceneDeck(pool, random = Math.random, roundSize = 5) {
  if (!pool.length || new Set(pool.map(scene => scene.id)).size !== pool.length) throw new Error('Scene IDs must be unique and nonempty.');
  let remaining = [], recent = [];
  return {
    next() {
      if (!remaining.length) {
        const shuffled = shuffle(pool, random);
        const avoid = new Set(recent);
        remaining = [...shuffled.filter(s => !avoid.has(s.id)), ...shuffled.filter(s => avoid.has(s.id))];
      }
      const scene = remaining.shift();
      recent = [...recent, scene.id].slice(-Math.min(roundSize * 2 - 1, pool.length - 1));
      return scene;
    }
  };
}
