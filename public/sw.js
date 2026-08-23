/* Blimo service worker.
 *
 * MUHIM DARS (23.08.2026): oldingi versiya sahifalarni "cache-first" bergan va
 * tarmoq uzilsa /panel o'rniga LENDINGni qaytargan — foydalanuvchi o'zini
 * "tizimdan chiqib ketdim" deb o'ylardi. Endi:
 *   - sahifalar (navigate) — HAR DOIM tarmoqdan; faqat internet yo'q bo'lsa oflayn sahifa
 *   - /_next/static/* — hash bilan nomlangan, o'zgarmaydi → cache-first
 *   - qolgan statik (ikonka, manifest) — stale-while-revalidate
 *   - /api/* — hech qachon keshlanmaydi
 */
const VERSION = "blimo-v2";
const STATIC = `${VERSION}-static`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC)
      .then((c) => c.addAll([OFFLINE_URL, "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isImmutable = (p) => p.startsWith("/_next/static/");
const isAsset = (p) => /\.(png|jpg|jpeg|svg|ico|webmanifest|css|woff2?|apk)$/.test(p);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // API — faqat tarmoqdan

  // 1) Sahifalar: tarmoq birinchi. Sahifani HECH QACHON boshqa sahifa bilan almashtirmaymiz.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // 2) O'zgarmas build fayllari: keshdan, bo'lmasa tarmoqdan va keshga qo'yamiz.
  if (isImmutable(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // 3) Qolgan statik: keshdan darrov ko'rsatamiz, fonda yangilaymiz.
  if (isAsset(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
  }
});
