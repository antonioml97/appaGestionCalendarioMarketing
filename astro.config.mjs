// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

/**
 * Configuracion principal de Astro para la app.
 *
 * Usa salida `server` y el adaptador de Netlify para desplegar la demo
 * como una aplicacion SSR con middleware.
 */
export default defineConfig({
  output: 'server',
  vite: {
    plugins: [tailwindcss()]
  },

  adapter: netlify()
});
