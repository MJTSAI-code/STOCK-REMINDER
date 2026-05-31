// 1. 定義快取名稱與需要離線儲存的檔案清單
const CACHE_NAME = 'stock-reminder-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 2. Install 事件：當手機第一次偵測到這個網站時，把核心檔案下載到手機硬碟裡
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('專案核心檔案已成功下載至手機本地快取！');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // 讓新版本的 Service Worker 立即生效，不需等待舊版關閉
});

// 3. Activate 事件：清除舊版本的快取，保持手機空間乾淨
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('正在清除舊的暫存檔案：', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // 讓 Service Worker 立即取得網頁的控制權
});

// 4. Fetch 事件：當手機網路很爛或斷網時，直接從手機硬碟撈網頁給使用者看（實現秒開與離線瀏覽）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 如果硬碟有快取就用快取，沒有的話就走網路下載
      return cachedResponse || fetch(event.request);
    })
  );
});
