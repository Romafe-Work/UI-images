import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/* Um site de várias páginas: a porta de entrada e uma página por app.
   base './' para o mesmo build servir no GitHub Pages e numa pasta qualquer. */
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        entrada: resolve(import.meta.dirname, 'index.html'),
        erp: resolve(import.meta.dirname, 'erp/index.html'),
        web: resolve(import.meta.dirname, 'web/index.html'),
        mobile: resolve(import.meta.dirname, 'mobile/index.html'),
      },
    },
  },
});
