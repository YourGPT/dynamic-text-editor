import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "dynamic-text-editor": resolve(__dirname, "../src"),
    },
  },
  build: {
    commonjsOptions: {
      include: [/dynamic-text-editor/, /node_modules/],
    },
    rollupOptions: {
      external: ["tslib"],
      output: {
        globals: {
          tslib: "tslib",
        },
      },
    },
  },
  optimizeDeps: {
    include: ["tslib", "styled-components"],
  },
});
