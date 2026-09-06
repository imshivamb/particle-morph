import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: "src/engine/index.ts",
      formats: ["es"],
      fileName: () => "scree.js",
    },
    rollupOptions: {
      external: [/^three(?:\/|$)/],
    },
  },
});
