const CACHE_NAME = 'anomancer-lighthouse-v1.36.0-workbench-3';
const APP_PATH = '/lighthouse/workbench';
const SHELL_URLS = [
  APP_PATH,
  '/lighthouse',
  '/manifest.webmanifest',
  '/admin.css',
  '/admin-shell.css',
  '/admin-workspace.css',
  '/admin-editorial.css',
  '/admin-narrative.css',
  '/admin-control-plane.css',
  '/admin-archive.css',
  '/admin-nanomancer.css',
  '/admin-mancer.css',
  '/admin-responsive.css',
  '/lighthouse-ui-constitution.css',
  '/admin-runtime.js',
  '/admin.js',
  '/admin-workspaces.js',
  '/admin-archive.js',
  '/admin-nanomancer.js',
  '/admin-mancer.js',
  '/admin-shell.js',
  '/admin-overlays.js',
  '/admin-feedback.js',
  '/admin-core.js',
  '/admin-agents.js',
  '/admin-orchestras.js',
  '/admin-machine-room.js',
  '/admin-orchestrator.js',
  '/admin-narramancer.js',
  '/narramancer-export.js',
  '/lighthouse-pwa.js',
  '/lighthouse/lab.css',
  '/lighthouse/lab.js',
  '/lighthouse/workspace-store.js',
  '/lighthouse/assets/lighthouse-mark-48.png',
  '/favicon.svg',
  '/icons/lahetyskone-192.png',
  '/icons/lahetyskone-512.png',
  '/icons/lahetyskone-maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => (key.startsWith('anomancer-lahetyskone-') || key.startsWith('anomancer-lighthouse-')) && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate' && (url.pathname === APP_PATH || url.pathname.startsWith(`${APP_PATH}/`))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(APP_PATH, response.clone()));
          return response;
        })
        .catch(() => caches.match(APP_PATH))
    );
    return;
  }

  if (!SHELL_URLS.includes(url.pathname)) return;
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
