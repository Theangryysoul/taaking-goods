import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { baseURL: "http://127.0.0.1:5173", browserName: "chromium", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: "https://catalog-test.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test", VITE_SUPABASE_ANON_KEY: "" },
  },
});
