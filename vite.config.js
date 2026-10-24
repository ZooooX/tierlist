import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relative : le build marche depuis n'importe quel dossier ou hébergeur statique
export default defineConfig({
  base: './',
  plugins: [react()],
});
