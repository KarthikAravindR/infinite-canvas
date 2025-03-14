import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts", // ✅ Make sure this file exports your component
      name: "ReactInfiniteCanvas",
      formats: ["es", "umd"], // ✅ Ensure both formats are supported
      fileName: (format) => `react-infinite-canvas.${format}.js`,
    },
    minify: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    target: ['es2020', 'edge88', 'firefox78', 'chrome79', 'safari14'],
  },
  plugins: [react(), dts({ rollupTypes: true }), cssInjectedByJsPlugin()]
});