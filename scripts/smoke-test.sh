#!/usr/bin/env bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:3001}"

curl --fail --silent --show-error "${base_url}/health"
echo
curl --fail --silent --show-error "${base_url}/ready"
echo
curl --fail --silent --show-error "${base_url}/api/v1/home"
echo
