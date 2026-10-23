import { defineConfig } from 'vite';

export default defineConfig({
  // Relative Pfade, damit das Spiel auch in einem Unterordner im Internet läuft.
  base: './',
  // Phaser ist groß. Das ist in Ordnung und braucht keine Warnung.
  build: { chunkSizeWarningLimit: 2000 },
  // Die Python-Umgebung für die Bilder-Werkzeuge gehört nicht zum Spiel.
  server: { watch: { ignored: ['**/.venv/**'] } },
});
