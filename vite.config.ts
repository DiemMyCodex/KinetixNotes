import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = typeof import.meta.dirname === 'string'
  ? import.meta.dirname
  : path.dirname(fileURLToPath(import.meta.url));

let swVersion = 'kinetix-dev';

export default defineConfig(() => {
  return {
    plugins: [
      svelte(),
      tailwindcss(),
      // Cache-bust the service worker shell on every content-bearing build.
      // Vite content-hashes asset filenames, so hashing the emitted names is enough.
      {
        name: 'stamp-service-worker-version',
        apply: 'build',
        generateBundle(_options, bundle) {
          const assetNames = Object.keys(bundle)
            .filter((name) => name.startsWith('assets/'))
            .sort();
          swVersion = `kinetix-${createHash('sha256')
            .update(assetNames.join('|'))
            .digest('hex')
            .slice(0, 10)}`;
        },
        closeBundle(error?: Error): void {
          if (error) return;
          const swPath = path.resolve(projectRoot, 'dist/sw.js');
          if (!fs.existsSync(swPath)) return;
          const source = fs.readFileSync(swPath, 'utf8');
          fs.writeFileSync(
            swPath,
            source.replace('__KINETIX_BUILD_VERSION__', swVersion)
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
