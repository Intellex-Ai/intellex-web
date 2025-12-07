/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// Explicitly disable push notifications. If a push event arrives (e.g. from a
// previously configured backend), ignore it and close any stray notifications.
(self as unknown as ServiceWorkerGlobalScope).addEventListener("push", (event: PushEvent) => {
  event.waitUntil(Promise.resolve());
});

(self as unknown as ServiceWorkerGlobalScope).addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
});
