import { RULES, BADGES } from './scenes.mjs?v=4';
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function hazardAt(scene, elapsed) {
  const progress = Math.max(0, Math.min(1, (elapsed - scene.cueMs) / scene.motionMs));
  return { x: scene.hazard.from[0] + (scene.hazard.to[0] - scene.hazard.from[0]) * progress,
    y: scene.hazard.from[1] + (scene.hazard.to[1] - scene.hazard.from[1]) * progress, progress };
}
export function isHit(scene, elapsed, x, y, width = 800) {
  if (elapsed < scene.cueMs || elapsed >= scene.durationMs) return false;
  const position = hazardAt(scene, elapsed);
  // Minimum target diameter of 56 CSS pixels, in the same SVG coordinate system.
  const minRadius = 28 * 800 / Math.max(width, 1);
  return ((x - position.x) / Math.max(scene.hazard.rx, minRadius)) ** 2 +
    ((y - position.y) / Math.max(scene.hazard.ry, minRadius)) ** 2 <= 1;
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
// Across bag boundaries, put the last round at the back of the next shuffled bag.
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
