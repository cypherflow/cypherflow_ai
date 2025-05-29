/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare let self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';
import debug from 'debug';

// Create debug namespace for service worker
const d = debug('app:sw');

//// Enable debug in development mode
//if (process.env.NODE_ENV === 'development') {
//  debug.enable('app:sw*');
//}

// Create specialized loggers
const dInstall = d.extend('install');
const dActivate = d.extend('activate');
const dFetch = d.extend('fetch');
const dCache = d.extend('cache');
const dMsg = d.extend('message');
const dError = d.extend('error');

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
  ...build, // the app itself
  ...files  // everything in `static`
];

// Log the service worker initialization
d(`Initializing SW version: ${version}`);
d('Assets to be cached: %O', ASSETS);

self.addEventListener('install', (event) => {
  dInstall('⚙️ Installing service worker...');
  
  // Create a new cache and add all files to it
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    dCache(`📦 Created cache: ${CACHE}`);
    
    dCache(`📥 Adding ${ASSETS.length} assets to cache...`);
    await cache.addAll(ASSETS);
    dCache('✅ All assets cached successfully');
  }

  event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
  dActivate('🚀 Activating service worker...');
  
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    const keyList = await caches.keys();
    dActivate(`Found ${keyList.length} caches: %O`, keyList);
    
    let deletedCount = 0;
    for (const key of keyList) {
      if (key !== CACHE) {
        dActivate(`🗑️ Deleting old cache: ${key}`);
        await caches.delete(key);
        deletedCount++;
      }
    }
    
    dActivate(`✅ Cleaned up ${deletedCount} old cache(s)`);
  }

  event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
  // ignore POST requests etc
  if (event.request.method !== 'GET') {
    dFetch(`⏭️ Ignoring non-GET request: ${event.request.method} ${event.request.url}`);
    return;
  }

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);
    
    // Get the current domain (your app's domain)
    const currentDomain = self.location.hostname;
    
    // Check if the request is for the same domain as the app
    const isSameDomain = url.hostname === currentDomain;
      
    dFetch(`📡 Fetch request: ${url.toString()}`);
    dFetch(`📍 Domain check: ${url.hostname} ${isSameDomain ? '✅ SAME' : '❌ EXTERNAL'} as app domain (${currentDomain})`);

    // `build`/`files` can always be served from the cache
    if (ASSETS.includes(url.pathname)) {
      dFetch(`🔍 Request for known asset: ${url.pathname}`);
      const cachedResponse = await cache.match(url.pathname);

      if (cachedResponse) {
        dCache(`📦 Serving from cache: ${url.pathname}`);
        return cachedResponse;
      }
      dCache(`⚠️ Asset not found in cache, will fetch from network: ${url.pathname}`);
    }

    // Try the network first for all requests
    try {
      dFetch(`🌐 Fetching from network: ${url.toString()}`);
      const response = await fetch(event.request);
      
      // if we're offline, fetch can return a value that is not a Response
      // instead of throwing - and we can't pass this non-Response to respondWith
      if (!(response instanceof Response)) {
        dError(`❌ Invalid response from fetch: ${url.toString()}`);
        throw new Error('invalid response from fetch');
      }

      dFetch(`✅ Network response: ${response.status} ${response.statusText}`);

      // Only cache successful responses from the same domain as the app
      if (response.status === 200 && isSameDomain) {
        dCache(`💾 Caching response: ${url.toString()}`);
        cache.put(event.request, response.clone());
      } else if (!isSameDomain) {
        dCache(`🚫 Not caching external resource: ${url.toString()}`);
      } else if (response.status !== 200) {
        dCache(`🚫 Not caching non-200 response (${response.status}): ${url.toString()}`);
      }

      return response;
    } catch (err) {
      dError(`⚠️ Network fetch failed: ${url.toString()}`, err);
      
      // Only try to return cached responses for same-domain requests
      if (isSameDomain) {
        dCache(`🔍 Checking cache for same-domain resource: ${url.toString()}`);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          dCache(`📦 Serving from cache (offline fallback): ${url.toString()}`);
          return cachedResponse;
        }
        dCache(`❌ Not found in cache: ${url.toString()}`);
      } else {
        dCache(`🚫 Not attempting to serve external resource from cache: ${url.toString()}`);
      }
      
      // If there's no cache or it's a different domain, return a 404
      dError(`❌ Returning 404 for: ${url.toString()}`);
      return new Response('Not Found', { status: 404 });
    }
  }

  event.respondWith(respond());
});

self.addEventListener('message', (event) => {
  dMsg(`📨 Message received: ${JSON.stringify(event.data)}`);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    dMsg('⏭️ Skip waiting instruction received');
    self.skipWaiting();
  }
});

// Log any errors that occur in the service worker
self.addEventListener('error', (event) => {
  dError('❌ Service worker error:', event.error);
});

// Log unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  dError('❌ Unhandled promise rejection in service worker:', event.reason);
});

d('🎉 Service worker script loaded');
