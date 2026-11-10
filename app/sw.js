// Physical Note（app/ のGoogleログイン版）の service worker（v15：セット欄の1RM表示・日付の行・保存の知らせを調整。v14 は RM計算表・RPE）。
// personal-release-20261108 で検証したロジックを再利用し、キャッシュ名と precache だけをGoogle版に合わせた。
// - install：必要な資産（ハッシュ付きの入力モジュールを含む）をすべて取れたときだけ skipWaiting する。
//   1つでも取れなければ install は失敗し、新しい service worker は破棄されて旧版がそのまま動く。
// - activate：Google版の旧キャッシュ（physicalnote-app-v14-rm-20261109）だけを消す。他のキャッシュや localStorage には触れない。
// - fetch：同じ origin の GET だけを扱う。このアプリの新しいキャッシュ（CACHE）にあればそれを返し、
//   裏で最新を取りに行って更新する。他のキャッシュは参照しない。
//   ok かつリダイレクトでない応答だけを保存する。外部URL・GET以外は扱わない（ブラウザに任せる）。
// - 画面の自動再読み込みはしない（入力中の下書きを守る）。
const CACHE = 'physicalnote-app-v15-rm2-20261110';
const OLD_CACHES = ['physicalnote-app-v14-rm-20261109'];
const PRECACHE = [
  './',
  'index.html',
  '../icon-180.png',
  '../training-entry/module/training-entry-DSgQEgr_.js',
  '../training-entry/module/training-entry---jH0SG0.css',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(Promise.all(OLD_CACHES.map((k) => caches.delete(k))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  const net = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });
  const update = net
    .then((res) => {
      if (!res.ok || res.redirected) return undefined;
      const copy = res.clone();
      return caches.open(CACHE).then((c) => c.put(req, copy));
    })
    .catch(() => {});
  e.waitUntil(update);
  e.respondWith(
    caches
      .open(CACHE)
      .then((c) => c.match(req))
      .then((hit) => hit || net),
  );
});
