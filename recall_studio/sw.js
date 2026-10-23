/* Offline service worker: scoped to Recall Studio's folder, including nested GitHub Pages paths. */
const CACHE='recall-studio-100-inline-1';
const CORE=['./','./index.html','./styles.css?b=ios100-inline-feedback-1','./startup.js?b=ios100-inline-feedback-1','./app.js?b=ios100-inline-feedback-1','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith('recall-studio-')&&name!==CACHE).map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});
async function offlineFallback(request){
 const hit=await caches.match(request,{ignoreSearch:true});
 return hit||await caches.match('./index.html')||Response.error();
}
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith((async()=>{
  try {
   const response=await fetch(request);
   if(response.ok&&response.type!=='opaque'){
    const cache=await caches.open(CACHE);
    cache.put(request,response.clone()).catch(()=>{});
   }
   return response;
  } catch(_) {
   return offlineFallback(request);
  }
 })());
});
