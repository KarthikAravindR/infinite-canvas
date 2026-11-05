import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      name: "ReactInfiniteCanvas",
      formats: ["es", "umd"],
      fileName: "react-infinite-canvas",
    },
    minify: true,
    cssMinify: "esbuild",
    rolldownOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
    target: ["es2020", "edge88", "firefox78", "chrome79", "safari14"],
  },
  // Classic runtime: the bundle imports only "react", never "react/jsx-runtime",
  // which webpack 5 can't resolve from React 17 in a "type": "module" package.
  plugins: [react({ jsxRuntime: "classic" }), cssInjectedByJsPlugin()],
});
