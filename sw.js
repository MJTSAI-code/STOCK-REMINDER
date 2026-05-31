const CACHE_NAME = 'stock-reminder-v5'; // 升級至 v5 徹底作廢舊快取
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安裝事件：快取基礎靜態資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] 下載最新 v5 靜態快取...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活事件：清除所有 v4 以前的舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] 刪除舊過期快取:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截請求：智慧型路由分流
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 1. 股票數據 API 或 TradingView 圖表：永遠直接走網路
  if (url.hostname.includes('finnhub.io') || url.hostname.includes('tradingview.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. 核心主網頁 (index.html / 根目錄)：改採「網路優先 (Network-First)」
  // 只要手機有網路，一定強制抓取線上最新版本，並在後台偷偷更新快取
  if (event.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)) // 只有在完全斷網時，才使用快取備份
    );
    return;
  }

  // 3. 其他靜態資源（如 icon、manifest）：採用「快取優先 (Cache-First)」
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
