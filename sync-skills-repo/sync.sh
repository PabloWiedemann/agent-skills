#!/usr/bin/env bash
# Copies the skills named in allowlist.txt from this Mac into the private agent-skills repo and pushes.
# Sources: ~/.agents/skills, ~/.cursor/skills, ~/.claude/skills (where `npx skills add` puts things).
# Layout in the repo: one folder per skill at the ROOT. Never deletes anything on the Mac.
set -eo pipefail

REPO_URL="https://github.com/PabloWiedemann/agent-skills.git"
REPO_DIR="$HOME/Dev/agent-skills"
SOURCES=("$HOME/.agents/skills" "$HOME/.cursor/skills" "$HOME/.claude/skills")
ALLOWLIST="$(dirname "$0")/allowlist.txt"

[ -f "$ALLOWLIST" ] || { echo "No allowlist.txt next to sync.sh — refusing to sync everything."; exit 1; }
# read allowlist, ignoring blank lines and comments
ALLOWED=()
while IFS= read -r line; do ALLOWED+=("$line"); done < <(grep -v '^[[:space:]]*#' "$ALLOWLIST" | sed 's/[[:space:]]*$//' | grep -v '^$')

# 1. Repo present and current
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Repo not found at $REPO_DIR — cloning it..."
  git clone "$REPO_URL" "$REPO_DIR"
fi
git -C "$REPO_DIR" pull --ff-only

# 2. Remove skills from the repo that are no longer allowed
for existing in "$REPO_DIR"/*/; do
  [ -f "$existing/SKILL.md" ] || continue
  name="$(basename "$existing")"
  if ! printf '%s\n' "${ALLOWED[@]}" | grep -qx "$name"; then
    echo "Removing from repo (not in allowlist): $name"
    rm -rf "$existing"
  fi
done

# 3. Copy allowed skills in (rsync -L follows shortcuts so real files get copied)
found=()
for name in "${ALLOWED[@]}"; do
  for src in "${SOURCES[@]}"; do
    if [ -f "$src/$name/SKILL.md" ]; then
      rsync -aL --delete --exclude '.git' "$src/$name/" "$REPO_DIR/$name/"
      found+=("$name"); break
    fi
  done
done
for name in "${ALLOWED[@]}"; do
  printf '%s\n' "${found[@]}" | grep -qx "$name" || echo "WARNING: '$name' is in allowlist but not installed on this Mac"
done

# 4. Commit and push only if something changed
cd "$REPO_DIR"
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "sync skills from Mac ($(date +%Y-%m-%d))"
  git push
  echo ""; echo "Pushed. Changed:"; git show --stat --oneline HEAD | tail -n +2
else
  echo "Nothing new to sync. Repo already matches the allowlist."
fi
echo ""; echo "Skills in repo now: $(ls -d "$REPO_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ')"
