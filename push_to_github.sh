#!/bin/bash
# Usage: ./push_to_github.sh <repo-name>
set -e
REPO="$1"
if [ -z "$REPO" ]; then
  echo "Usage: ./push_to_github.sh <github-repo-name>"
  exit 1
fi
git init
git add .
git commit -m "Initial DietX starter"
gh repo create "$REPO" --public --source=. --remote=origin --push
echo "Pushed to GitHub repo: $REPO"
