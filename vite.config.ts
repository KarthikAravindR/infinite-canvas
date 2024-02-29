import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "react-infinite-canvas",
    },
    rollupOptions: {
      output: {
        // Output directory
        dir: 'dist',
        // Entry file names
        entryFileNames: '[name].js',
        // Chunk file names (if any)
        chunkFileNames: 'chunks/[name].js',
        // Format of the generated bundle
        // format: 'es',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
      },
      },
    },
  },
});
