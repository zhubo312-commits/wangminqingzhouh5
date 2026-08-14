import { copyFileSync, existsSync, linkSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export function ensureDirectory(directory: string): void {
  mkdirSync(directory, { recursive: true });
}

export function hardLinkOrCopy(source: string, target: string): void {
  ensureDirectory(path.dirname(target));
  if (existsSync(target)) return;
  try {
    linkSync(source, target);
  } catch {
    copyFileSync(source, target);
  }
}

export function walkFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const output: string[] = [];
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop()!;
    for (const entry of readdirSync(directory)) {
      const absolute = path.join(directory, entry);
      if (statSync(absolute).isDirectory()) pending.push(absolute);
      else output.push(absolute);
    }
  }
  return output.sort();
}
