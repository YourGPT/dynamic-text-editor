import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "externalize-styled-deps",
      resolveId(id) {
        // Externalize all styled-components and emotion related packages
        if (id.includes("styled-components") || id.includes("@emotion/")) {
          return { id, external: true };
        }
        return null;
      },
    },
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "dynamic-text-editor": path.resolve("../src"),
    },
  },
  build: {
    commonjsOptions: {
      include: [/dynamic-text-editor/, /node_modules/],
    },
    rollupOptions: {
      external: ["tslib", "styled-components", "@emotion/is-prop-valid", "@emotion/sheet", "@emotion/stylis", "@emotion/unitless", "@emotion/react", "hoist-non-react-statics", "shallowequal"],
      output: {
        globals: {
          tslib: "tslib",
          "styled-components": "styled",
          "@emotion/is-prop-valid": "isPropValid",
          "@emotion/sheet": "emotionSheet",
          "@emotion/stylis": "stylis",
          "@emotion/unitless": "unitless",
          "@emotion/react": "emotionReact",
          "hoist-non-react-statics": "hoistNonReactStatics",
          shallowequal: "shallowequal",
        },
      },
    },
  },
  optimizeDeps: {
    include: ["tslib", "styled-components"],
  },
});
