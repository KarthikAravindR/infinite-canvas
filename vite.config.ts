import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  build: {
    lib: {
      entry: "src/main.tsx",
      name: "react-infinite-canvas",
    },
    rollupOptions: {
      // input: "src/main.tsx",
      output: {
        // Output directory
        dir: "dist",
        // Entry file names
        entryFileNames: "[name].js",
        // // Chunk file names (if any)
        chunkFileNames: "chunks/[name].js",
        // // Format of the generated bundle
        // // format: 'es',
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
