/* Online content stays on the network; only the neutral offline page is cached. */
const CACHE = 'ls-pwa-offline-v2';
const OFFLINE = '/offline.html';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.add(new Request(OFFLINE, {cache:'reload'}))));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ls-pwa-offline-') && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(OFFLINE)) || new Response('Keine Internetverbindung. Bitte erneut versuchen.', {headers:{'Content-Type':'text/plain; charset=utf-8'}})));
});
// Waiting updates activate after the existing app windows close, never during a form or game.
