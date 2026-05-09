
const CACHE = 'glow-scent-v1';
const ASSETS = [
  '/', '/index.html','/products.html','/product.html','/cart.html','/checkout.html','/order-confirmation.html',
  '/about.html','/contact.html','/faq.html','/policies.html','/login.html','/orders.html','/settings.html',
  '/styles.css','/app.js','/cart.js','/data/products.json','/assets/favicon.png','/assets/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{});
      return r;
    }).catch(()=>res))
  );
});