/* ============================================================
   Service Worker — التحديث الفوري والعمل بدون إنترنت (PWA)
   ============================================================ */

// ✅ اسم الكاش يعتمد على التاريخ (يضمن تحديث الملفات فور رفعها)
const CACHE_VERSION = 'v' + new Date().toISOString().slice(0, 10);
const CACHE_NAME = 'nabd-alsaf-' + CACHE_VERSION;

// ✅ قائمة الملفات الصحيحة فقط
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './config.js',
  './js/utils.js',
  './js/api.js',
  './js/auth.js',
  './js/state.js',
  './js/classes.js',
  './js/students.js',
  './js/points.js',
  './js/tools.js',
  './js/reports.js',
  './js/ai.js',
  './js/app.js',
  './manifest.json'
];

// 1. التثبيت: حفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => {
      console.log('✅ تم تثبيت Service Worker بنجاح');
      return self.skipWaiting(); // تفعيل النسخة الجديدة فوراً
    }).catch(err => {
      console.error('❌ فشل تثبيت الكاش:', err);
    })
  );
});

// 2. التفعيل: حذف الكاش القديم والبدء
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key)) // حذف الكاش القديم
      );
    }).then(() => {
      console.log('🚀 Service Worker نشط وجاهز');
      return self.clients.claim(); // السيطرة على الصفحة فوراً
    })
  );
});

// 3. الجلب (Fetch): استراتيجية "الشبكة أولاً" لضمان أحدث نسخة
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير GET والطلبات الخارجية (مثل API أو CDN)
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;
  if (event.request.url.includes('cdn.jsdelivr')) return;
  if (event.request.url.includes('cdnjs.cloudflare.com')) return;
  if (event.request.url.includes('cdn.sheetjs.com')) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;
  if (event.request.url.includes('fonts.gstatic.com')) return;

  event.respondWith(
    // 1. حاول جلب الملف من الإنترنت أولاً (لأحدث نسخة)
    fetch(event.request).then(response => {
      // إذا نجح الاتصال، احفظ النسخة الجديدة في الكاش
      if (response && response.status === 200 && response.type === 'basic') {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      // 2. إذا فشل الاتصال (لا يوجد إنترنت)، استخدم النسخة المحفوظة
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        // إذا لم تكن الصفحة محفوظة، أعد صفحة index
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
