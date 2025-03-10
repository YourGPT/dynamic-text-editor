import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "dynamic-text-editor": path.resolve(__dirname, "../src"),
    },
  },
  build: {
    commonjsOptions: {
      include: [/dynamic-text-editor/, /node_modules/],
    },
    rollupOptions: {
      external: ["tslib", "@emotion/is-prop-valid"],
      output: {
        globals: {
          tslib: "tslib",
          "@emotion/is-prop-valid": "isPropValid",
        },
      },
    },
  },
  optimizeDeps: {
    include: ["tslib", "styled-components", "@emotion/is-prop-valid"],
  },
});
