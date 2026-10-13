// Vite builds the generated multi-page site (see tools/build.mjs) into dist/ with hashed, minified CSS/JS
// and images. `npm run build` regenerates the HTML from src/ first, so dist/ always matches src/.
import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const htmlIn = (dir) => readdirSync(resolve(root, dir)).filter((f) => f.endsWith('.html')).map((f) => resolve(root, dir, f));

// Files fetched or linked by URL at runtime (not discoverable from the HTML), copied unchanged.
const passthrough = ['robots.txt', 'sitemap.xml', 'js/search-index.json', 'images/og-asecon.jpg', 'images/favicon.svg'];

const copyPassthrough = () => ({
  name: 'asecon-copy-passthrough',
  apply: 'build',
  closeBundle() {
    for (const f of passthrough) {
      const from = resolve(root, f);
      if (!existsSync(from)) continue;
      const to = resolve(root, 'dist', f);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
    }
  },
});

export default defineConfig({
  root,
  publicDir: false,
  plugins: [copyPassthrough()],
  server: { port: 5173, open: false },
  preview: { port: 4173 },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0, // keep images and video as files (hashed, cacheable)
    rollupOptions: {
      input: [...htmlIn('.'), ...htmlIn('services')],
      output: {
        entryFileNames: 'assets/site-[hash].js',
        chunkFileNames: 'assets/site-[hash].js',
        assetFileNames: (a) => (a.names?.[0] || a.name || '').endsWith('.css') ? 'assets/site-[hash][extname]' : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
