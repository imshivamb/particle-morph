import { defineConfig } from "vitest/config";

export default defineConfig({
  root: ".",
  publicDir: "public",
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
