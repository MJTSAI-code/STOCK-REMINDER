const CACHE_NAME = 'stock-reminder-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安裝事件：快取基礎靜態資源（網頁外殼與設定）
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] 開始下載最新 v4 靜態快取...');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活事件：清除舊版快取，強制瀏覽器立刻套用最新的 index.html 樣式
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

  // 💡 關鍵優化：如果是 Finnhub API 或 TradingView 圖表，直接走網路，不使用任何快取以確保數據即時
  if (url.hostname.includes('finnhub.io') || url.hostname.includes('tradingview.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 靜態資源（網頁外殼）：快取優先，若無快取則由網路下載，確保沒網路時也能秒開 App
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
