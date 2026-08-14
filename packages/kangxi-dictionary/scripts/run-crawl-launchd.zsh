#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export KANGXI_HTML_CONCURRENCY="${KANGXI_HTML_CONCURRENCY:-300}"
export KANGXI_ASSET_CONCURRENCY="${KANGXI_ASSET_CONCURRENCY:-500}"
export KANGXI_MIN_DELAY_MS="${KANGXI_MIN_DELAY_MS:-5}"
export KANGXI_LOG_LEVEL="${KANGXI_LOG_LEVEL:-warn}"
export KANGXI_ASSET_HOSTS="${KANGXI_ASSET_HOSTS:-ygsf.cdn.bcebos.com}"
export KANGXI_RELEASE_ID="${KANGXI_RELEASE_ID:-kangxi-cn-20260813.r3}"

readonly REPOSITORY_ROOT="/Users/zhubo/开发文件/轻舟发现页"
cd "$REPOSITORY_ROOT"

exec /opt/homebrew/bin/npm run cli --workspace @guoxue/kangxi-dictionary -- \
  crawl --resume --retry-failed --release "$KANGXI_RELEASE_ID"
