import { mount } from 'svelte';
import App from './App.svelte';
import './index.css';

const target = document.getElementById('root');
if (target) {
  mount(App, { target });
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const announce = (worker: ServiceWorker | null) => {
        if (!worker) return;
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          window.dispatchEvent(new Event('kinetix:updated'));
        }
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new Event('kinetix:updated'));
          }
        });
      };
      if (registration.waiting && navigator.serviceWorker.controller) {
        window.dispatchEvent(new Event('kinetix:updated'));
      }
      announce(registration.installing);
      registration.addEventListener('updatefound', () => announce(registration.installing));
    } catch {
      // Registration is best-effort; the app stays fully usable without it.
    }
  });
}
