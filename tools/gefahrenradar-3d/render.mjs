// Rendert Gefahrenradar-Szenen zu MP4 + Standbild + Trefferspur.
// Aufruf: node tools/gefahrenradar-3d/render.mjs [id ...] [--fps 25] [--preview t1,t2,...]
// Voraussetzung: ./setup.sh (three.js lokal), Playwright mit Chromium, ffmpeg.
import {createServer} from 'node:http';
import {readFile, writeFile, mkdir, readdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({chromium} = require('playwright')); } catch { ({chromium} = await import('playwright')); }

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const gameDir = path.join(root, 'dist/konzept/lernwelt/gefahrenradar');
const outDir = path.join(gameDir, 'video');
const trackDir = path.join(here, 'out/tracks');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const FPS = +opt('--fps', 25), PREVIEW = opt('--preview', null), CRF = opt('--crf', '28');
const {SCENES: GAME} = await import(pathToFileURL(path.join(gameDir, 'scenes.mjs')).href);
const ids = args.length ? args : GAME.map(s => s.id);

const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript'};
const server = createServer(async (req, res) => {
  try { const p = path.join(here, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!p.startsWith(here)) throw 0; res.writeHead(200, {'Content-Type': types[path.extname(p)] || 'application/octet-stream'}); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
await mkdir(outDir, {recursive: true}); await mkdir(trackDir, {recursive: true}); await mkdir(path.join(here, 'out/preview'), {recursive: true});

for (const id of ids) {
  const g = GAME.find(s => s.id === id); if (!g) { console.error('unbekannt', id); continue; }
  const page = await browser.newPage({viewport: {width: 960, height: 672}});
  const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const started = Date.now();
  await page.goto(`http://localhost:${port}/index.html?id=${id}&meta=${encodeURIComponent(JSON.stringify({cue: g.cueMs, dur: g.durationMs}))}`, {waitUntil: 'commit', timeout: 0});
  await page.waitForFunction(() => window.ready || false, null, {timeout: 0, polling: 200}).catch(() => {});
  if (errors.length) { console.error(id, errors); await page.close(); continue; }
  const {T0, LEN} = await page.evaluate(() => ({T0: api.T0, LEN: api.LEN}));
  if (PREVIEW) {
    for (const t of PREVIEW.split(',').map(Number)) { await page.evaluate(t => api.frame(t), t); await page.screenshot({path: path.join(here, `out/preview/${id}-${t}.jpg`), type: 'jpeg', quality: 85}); }
    console.log(id, 'Vorschau', ((Date.now() - started) / 1000).toFixed(1) + 's'); await page.close(); continue;
  }
  const frames = Math.round(LEN * FPS);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', CRF, '-profile:v', 'main', '-level', '3.1', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(outDir, `${id}.mp4`)], {stdio: ['pipe', 'inherit', 'inherit']});
  for (let i = 0; i < frames; i++) {
    await page.evaluate(t => api.frame(t), i / FPS);
    const buf = await page.screenshot({type: 'jpeg', quality: 93});
    if (i === 0) await writeFile(path.join(outDir, `${id}.jpg`), await page.screenshot({type: 'jpeg', quality: 72}));
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  // Vorschaubild für den Startbildschirm des Spiels (erste Szene, Gefahr sichtbar).
  if (id === GAME[0].id) { await page.evaluate(t => api.frame(t), T0 + 1.6); await writeFile(path.join(outDir, 'preview.jpg'), await page.screenshot({type: 'jpeg', quality: 78})); }
  // Trefferspur alle 100 ms im 800 × 560-System: [x, y, rx, ry, ...weitere Bereiche]
  const track = [];
  for (let ms = 0; ms <= LEN * 1000; ms += 100) track.push((await page.evaluate(t => api.areas(t), ms / 1000)).flat());
  await writeFile(path.join(trackDir, `${id}.json`), JSON.stringify({id, videoCueMs: Math.round(T0 * 1000), lengthMs: Math.round(LEN * 1000), step: 100, areas: track}));
  console.log(id, frames, 'Bilder', ((Date.now() - started) / 1000).toFixed(0) + 's');
  await page.close();
}
// Alle vorhandenen Spuren zu einem Modul für das Spiel zusammenführen.
const all = {};
for (const f of (await readdir(trackDir)).filter(f => f.endsWith('.json')).sort()) { const t = JSON.parse(await readFile(path.join(trackDir, f), 'utf8')); all[t.id] = {cue: t.videoCueMs, len: t.lengthMs, step: t.step, areas: t.areas}; }
if (!PREVIEW) await writeFile(path.join(gameDir, 'video-tracks.mjs'), `// Automatisch erzeugt von tools/gefahrenradar-3d/render.mjs. Nicht von Hand bearbeiten.\n// Je Szene: Gefahren-Zeitpunkt im Video (cue), Videolänge (len) und Gefahrenbereiche alle ${100} ms im 800 × 560-System.\nexport const VIDEO_TRACKS = ${JSON.stringify(all)};\n`);
await browser.close(); server.close();
