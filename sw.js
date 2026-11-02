// Pandoro (versão web): guarda o app para abrir mesmo sem internet.
// Os dados não passam por aqui: ficam no aparelho e vão para o GitHub pela sincronização.
const VERSION = '2.3.0-8';
const CACHE = 'pandoro-' + VERSION;
const FILES = ["./","index.html","app.js?v=2.3.0-8","styles.css?v=2.3.0-8","manifest.webmanifest","apple-touch-icon.png","icon-192.png","icon-512.png"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('pandoro-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // GitHub e Anthropic: sempre pela rede
  if (req.mode === 'navigate') {
    // página: tenta a rede (para pegar versões novas) e cai no que está guardado
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./').then((r) => r || caches.match('index.html')))
    );
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
