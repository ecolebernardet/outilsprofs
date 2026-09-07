const CACHE_NAME = 'outilsprofs-v7.2';
const ASSETS = [
  './',
  './index.html',
  './outilsprofs_icone.png'
  // Ajoutez ici vos autres fichiers .html si vous voulez qu'ils soient dispos hors-ligne
];

// Installation : mise en cache des ressources
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force le nouveau SW à prendre le contrôle immédiatement
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activation : NETTOYAGE des anciens caches (v6, v7...)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Force l'activation immédiate sur tous les onglets ouverts
});

// Récupération :
// - Pages HTML (navigation) : stratégie "Network First" -> toujours essayer
//   d'aller chercher la dernière version sur le serveur, et on ne se
//   rabat sur le cache que si le réseau est indisponible (hors-ligne).
// - Autres ressources (images, icônes...) : stratégie "Cache First"
//   pour rester rapide, car ces fichiers changent rarement.
self.addEventListener('fetch', (event) => {
  const isHTMLRequest =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  if (isHTMLRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // On met à jour le cache avec la version fraîche
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Hors-ligne : on sert la dernière version connue en cache
          return caches.match(event.request);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
