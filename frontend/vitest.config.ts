import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    browser: {
      provider: playwright(),

      // Activate your browser mode!
      enabled: true,
      // at least one instance is required
      instances: [{ browser: "chromium" }],
    },
  },
});
