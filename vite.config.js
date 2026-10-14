import { defineConfig } from 'vite';

export default defineConfig({
  // Relative Pfade, damit das Spiel auch in einem Unterordner im Internet läuft.
  base: './',
  // Phaser ist groß. Das ist in Ordnung und braucht keine Warnung.
  build: { chunkSizeWarningLimit: 2000 },
});
