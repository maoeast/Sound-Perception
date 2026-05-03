#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

export PATH="${PROJECT_ROOT}/.local/bin:${PATH}"
export CARGO_HOME="${PROJECT_ROOT}/.local/cargo"
export CARGO_TARGET_DIR="${PROJECT_ROOT}/.local/cargo-target"
export XDG_CONFIG_HOME="${PROJECT_ROOT}/.local/xdg-config"
export XDG_DATA_HOME="${PROJECT_ROOT}/.local/xdg-data"
export XDG_CACHE_HOME="${PROJECT_ROOT}/.local/xdg-cache"

mkdir -p \
  "${CARGO_HOME}" \
  "${CARGO_TARGET_DIR}" \
  "${XDG_CONFIG_HOME}" \
  "${XDG_DATA_HOME}" \
  "${XDG_CACHE_HOME}"

echo "Project env enabled from ${PROJECT_ROOT}/.local/bin"
echo "node: $(command -v node)"
echo "npm:  $(command -v npm)"
echo "cargo home: ${CARGO_HOME}"
echo "cargo target: ${CARGO_TARGET_DIR}"
echo "xdg config: ${XDG_CONFIG_HOME}"
echo "xdg data: ${XDG_DATA_HOME}"
echo "xdg cache: ${XDG_CACHE_HOME}"
