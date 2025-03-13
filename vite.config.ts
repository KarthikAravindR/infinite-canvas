import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts", // ✅ Make sure this file exports your component
      name: "ReactInfiniteCanvas",
      formats: ["es", "umd"], // ✅ Ensure both formats are supported
      fileName: (format) => `react-infinite-canvas.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"], // ✅ Do not bundle React
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/], // ✅ Ensure CJS modules work properly
    },
  },
  optimizeDeps: {
    exclude: ["react", "react-dom"], // ✅ Ensure React is not optimized incorrectly
  },
  plugins: [
    react({
      jsxRuntime: "automatic", // ✅ Explicitly define JSX runtime
    }),
    cssInjectedByJsPlugin(),
    dts(),
  ],
});
