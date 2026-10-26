import {build} from 'esbuild';
import {mkdir,rm,copyFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist/client/navigator/assets',{recursive:true});
await build({entryPoints:['app/main.tsx'],bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',jsx:'automatic',minify:true,outdir:'dist/client/navigator/assets',entryNames:'app',chunkNames:'[name]-[hash]',define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
await copyFile('public/navigator-font-license.txt','dist/client/navigator/assets/font-license.txt');
await writeFile('dist/client/navigator/app.html',`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Fahrschul-Navigator · LANE SWITCH</title><link rel="stylesheet" href="/navigator/assets/app.css"><script type="module" src="/navigator/assets/app.js"></script></head><body style="margin:0"><div id="root"></div><noscript>Bitte aktiviere JavaScript, um den Fahrschul-Navigator zu verwenden.</noscript></body></html>`);
await build({entryPoints:['worker/index.ts'],bundle:true,format:'esm',platform:'browser',external:['cloudflare:workers'],outfile:'dist/worker.mjs',minify:true});
console.log('Navigator client and Worker built.');
