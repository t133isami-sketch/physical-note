// Gemini版：アプリ本体（画面のファイル）を端末に保存しておき、開いたらすぐ表示する。
// 裏で新しい版を取りにいき、次に開いたときに反映される。記録データ（Apps Script）は扱わない。
const CACHE='physicalnote-gemini-v2'; // Gemini版専用。今までのアプリの保存分とは別
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','icon-180.png'])).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('physicalnote-gemini-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(req);
    const net=fetch(req.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{
      if(res.ok&&!res.redirected)c.put(req,res.clone());
      return res;
    });
    if(hit){e.waitUntil(net.catch(()=>{}));return hit;}
    return net;
  }));
});
