#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") <branch-to-merge>" >&2
  echo "Merges <branch-to-merge> into main, but only if <branch-to-merge> already contains every commit currently on origin/main." >&2
  exit 1
}

branch="${1:-}"
[ -z "$branch" ] && usage

if ! git rev-parse --verify --quiet "$branch" >/dev/null; then
  echo "error: branch '$branch' does not exist" >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "error: working tree is not clean; commit or stash changes first" >&2
  exit 1
fi

git fetch origin main

if ! git merge-base --is-ancestor origin/main "$branch"; then
  echo "error: '$branch' is behind origin/main" >&2
  echo "Pull main into it first, e.g.:" >&2
  echo "  git checkout $branch && git merge origin/main   # or: git rebase origin/main" >&2
  exit 1
fi

git checkout main
git pull origin main
git merge --no-ff "$branch"

echo "Merged '$branch' into main."
