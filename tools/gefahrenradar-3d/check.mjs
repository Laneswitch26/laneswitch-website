// Kollisionsprüfung aller Szenen ohne Rendern: node tools/gefahrenradar-3d/check.mjs [id ...]
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath, pathToFileURL} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium} = createRequire(import.meta.url)('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const {SCENES: GAME} = await import(pathToFileURL(path.resolve(here, '../../dist/konzept/lernwelt/gefahrenradar/scenes.mjs')).href);
const ids = process.argv.slice(2).length ? process.argv.slice(2) : GAME.map(s => s.id);
const server = createServer(async (req, res) => { try { const p = path.join(here, decodeURIComponent(new URL(req.url, 'http://x').pathname)); res.writeHead(200, {'Content-Type': p.endsWith('.html') ? 'text/html' : 'text/javascript'}); res.end(await readFile(p)); } catch { res.writeHead(404); res.end(); } }).listen(0);
const browser = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
let total = 0;
for (const id of ids) {
  const g = GAME.find(s => s.id === id); const page = await browser.newPage({viewport: {width: 320, height: 224}}); page.on('pageerror', e => console.error(id, 'Fehler:', e.message));
  await page.goto(`http://localhost:${server.address().port}/index.html?check=1&id=${id}&meta=${encodeURIComponent(JSON.stringify({cue: g.cueMs, dur: g.durationMs}))}`, {waitUntil: 'commit', timeout: 0});
  await page.waitForFunction(() => window.ready, null, {timeout: 120000});
  const hits = await page.evaluate(() => api.collisions());
  console.log(`${id}: ${hits.length ? hits.length + ' Überschneidung(en)' : 'ok'}`); for (const h of hits) console.log('   ' + h);
  total += hits.length; await page.close();
}
await browser.close(); server.close(); process.exitCode = total ? 1 : 0;
