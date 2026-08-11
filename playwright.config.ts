import { defineConfig } from "@playwright/test";

const rawPublicBasePath = process.env.PUBLIC_BASE_PATH?.trim() || "/";
const publicBasePath =
  rawPublicBasePath === "/"
    ? "/"
    : `/${rawPublicBasePath.replace(/^\/+|\/+$/g, "")}/`;
const webPort = Number(process.env.E2E_PORT ?? "4173");
if (!Number.isInteger(webPort) || webPort < 1 || webPort > 65_535) {
  throw new Error("E2E_PORT must be a valid TCP port");
}
const webOrigin = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `${webOrigin}${publicBasePath}`,
    browserName: "chromium",
    channel: "chrome",
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `VITE_ENABLE_JUECE_VALIDATION=true PUBLIC_BASE_PATH=${publicBasePath} npm run dev --workspace @guoxue/web -- --host 127.0.0.1 --port ${webPort}`,
    url: `${webOrigin}${publicBasePath}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "mobile-360",
      use: { viewport: { width: 360, height: 780 } },
    },
    {
      name: "mobile-390",
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "mobile-430",
      use: { viewport: { width: 430, height: 932 } },
    },
  ],
});
