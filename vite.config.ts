import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import * as globLib from "glob";
const { sync } = globLib;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
    {
      name: "copy-css",
      writeBundle() {
        // Copy CSS files to dist
        const cssFiles = sync("src/**/*.css");
        for (const file of cssFiles) {
          const content = readFileSync(file, "utf-8");
          const targetPath = file.replace("src/", "dist/");

          // Ensure directory exists
          mkdirSync(dirname(targetPath), { recursive: true });
          writeFileSync(targetPath, content);
        }
      },
    },
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "DynamicPromptEditor",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom", "styled-components"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "styled-components": "styled",
        },
      },
    },
    cssCodeSplit: false,
  },
});
