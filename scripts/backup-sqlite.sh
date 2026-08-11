#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
database_path="${SQLITE_PATH:-${project_root}/data/guoxue.db}"
backup_directory="${BACKUP_DIR:-${project_root}/data/backups}"

if [[ ! -f "$database_path" ]]; then
  echo "Database does not exist: $database_path" >&2
  exit 1
fi

if [[ "$database_path" == *"'"* || "$backup_directory" == *"'"* ]]; then
  echo "Paths containing single quotes are not supported" >&2
  exit 1
fi

mkdir -p "$backup_directory"
timestamp="$(date +%Y%m%d-%H%M%S)"
backup_path="${backup_directory}/guoxue-${timestamp}.db"

sqlite3 "$database_path" ".timeout 5000" ".backup '$backup_path'"
integrity="$(sqlite3 "$backup_path" "PRAGMA integrity_check;")"

if [[ "$integrity" != "ok" ]]; then
  echo "Backup integrity check failed: $integrity" >&2
  exit 1
fi

echo "Backup created: $backup_path"
