#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
GIT_STATE_ROOT="${HOME}/.codex/memories/sound-git-repo-20260503-0437"
GIT_DIR_PATH="${GIT_STATE_ROOT}/.git"

if [[ ! -d "${GIT_DIR_PATH}" ]]; then
  echo "Git metadata directory not found: ${GIT_DIR_PATH}" >&2
  return 1 2>/dev/null || exit 1
fi

export GIT_DIR="${GIT_DIR_PATH}"
export GIT_WORK_TREE="${PROJECT_ROOT}"

echo "Git env enabled"
echo "GIT_DIR=${GIT_DIR}"
echo "GIT_WORK_TREE=${GIT_WORK_TREE}"
echo "branch: $(git branch --show-current)"
echo "head:   $(git rev-parse --short HEAD)"
