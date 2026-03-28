const CACHE_NAME = 'innerflow-v2'; // 每次更新程式碼，建議手動跳一版 (v2, v3...)
const ASSETS = [
  '/Innerflow/',
  '/Innerflow/index.html',
  '/Innerflow/manifest.json',
  '/Innerflow/icon.png'
];

// 1. 安裝階段：強制跳過等待，立即安裝新版
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); 
});

// 2. 激活階段：刪除舊版的快取，並立即接管頁面
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

// 3. 抓取策略：網路優先 (Network First)
// 邏輯：先去網路上抓最新的 -> 抓到了就存入快取並顯示 -> 沒網路才讀舊快取
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // 如果網路請求成功，就把新內容存進快取
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // 如果斷網或 GitHub 暫時連不上，才改用快取
        return caches.match(e.request);
      })
  );
});
