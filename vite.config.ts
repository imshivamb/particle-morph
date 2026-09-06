import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    emptyOutDir: false,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
