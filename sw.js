const CACHE_NAME = 'innerflow-v3';
const ASSETS = [
  '/Innerflow/',
  '/Innerflow/index.html',
  '/Innerflow/manifest.json',
  '/Innerflow/icon.png'
];

// 1. 安裝階段
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. 激活階段：刪除舊版快取
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// 3. 抓取策略：只處理同源的 GET 請求，外部 API（GAS 等）完全不攔截
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 跳過非 GET 請求（POST 不能存入 Cache）
  if (e.request.method !== 'GET') return;

  // 跳過外部請求（只處理同源的靜態資源）
  if (url.origin !== self.location.origin) return;

  // 網路優先：先抓網路，失敗才用快取
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => caches.match(e.request))
  );
});
