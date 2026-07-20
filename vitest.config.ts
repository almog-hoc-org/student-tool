import { defineConfig } from "vitest/config";
import path from "path";

// בדיקות יחידה על מנועי החישוב — קוד טהור, ללא DOM.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
