import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ROOT = fileURLToPath(
  new URL("../../../../", import.meta.url),
);

export function resolveFromProjectRoot(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(PROJECT_ROOT, value);
}

export function resolveMigrationsDirectory(): string {
  const candidates = [
    process.env.MIGRATIONS_DIR,
    path.resolve(process.cwd(), "migrations"),
    path.resolve(PROJECT_ROOT, "apps/server/migrations"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  const existing = candidates.find((candidate) => existsSync(candidate));
  return existing ?? candidates[candidates.length - 1]!;
}
