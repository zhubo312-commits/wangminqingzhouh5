import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

function normalizePublicBasePath(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}/`;
}

const publicBasePath = normalizePublicBasePath(process.env.PUBLIC_BASE_PATH);
const publicBasePrefix =
  publicBasePath === "/" ? "" : publicBasePath.replace(/\/$/, "");
const stripPublicBasePrefix = (requestPath: string) =>
  publicBasePrefix && requestPath.startsWith(publicBasePrefix)
    ? requestPath.slice(publicBasePrefix.length) || "/"
    : requestPath;

export default defineConfig({
  base: publicBasePath,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      [`${publicBasePrefix}/api`]: {
        target: "http://localhost:3001",
        rewrite: stripPublicBasePrefix,
      },
      [`${publicBasePrefix}/health`]: {
        target: "http://localhost:3001",
        rewrite: stripPublicBasePrefix,
      },
      [`${publicBasePrefix}/ready`]: {
        target: "http://localhost:3001",
        rewrite: stripPublicBasePrefix,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
