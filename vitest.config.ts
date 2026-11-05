import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// macOS 27 blocks Playwright's Firefox 157 from reading
// ~/Library/Application Support/Firefox, so it exits with "Could not find
// profile folder". An empty home folder per run lets it start.
// Remove once Playwright ships a Firefox that no longer needs it (>= 1.65).
const firefox = playwright(
  process.platform === "darwin"
    ? {
        launchOptions: {
          env: {
            ...process.env,
            CFFIXED_USER_HOME: mkdtempSync(path.join(tmpdir(), "pw-firefox-home-")),
          } as Record<string, string>,
        },
      }
    : {},
);

export default defineConfig({
  plugins: [react()],
  // TEST_DIST=1 runs the same browser tests against the built bundle.
  resolve:
    process.env.TEST_DIST === "1"
      ? {
          alias: [
            {
              find: /^.*\/src\/main$/,
              replacement: path.resolve("dist/react-infinite-canvas.js"),
            },
          ],
        }
      : {},
  test: {
    unstubGlobals: true,
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["test/unit/**/*.test.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: ["test/browser/**/*.test.tsx"],
          setupFiles: ["test/browser/setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            viewport: { width: 1000, height: 700 },
            instances: [
              { browser: "chromium" },
              { browser: "firefox", provider: firefox },
              { browser: "webkit" },
            ],
          },
        },
      },
    ],
  },
});
