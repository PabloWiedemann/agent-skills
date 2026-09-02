#!/usr/bin/env bash
# Copies every skill installed on this Mac into the private agent-skills repo and pushes it.
# Sources: ~/.agents/skills, ~/.cursor/skills, ~/.claude/skills (this is where `npx skills add` puts things).
# Safe to run as often as you like. Never deletes anything from your Mac.
set -euo pipefail

REPO_URL="https://github.com/PabloWiedemann/agent-skills.git"
REPO_DIR="$HOME/Dev/agent-skills"
SOURCES=("$HOME/.agents/skills" "$HOME/.cursor/skills" "$HOME/.claude/skills")

# 1. Make sure the repo exists on this Mac and is up to date
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Repo not found at $REPO_DIR — cloning it..."
  git clone "$REPO_URL" "$REPO_DIR"
fi
git -C "$REPO_DIR" pull --ff-only

# 2. Copy every skill folder (= a folder containing SKILL.md) into the repo.
#    rsync -L follows shortcuts (symlinks) so real files get copied, not the shortcut.
synced=()
for src in "${SOURCES[@]}"; do
  [ -d "$src" ] || continue
  for skill in "$src"/*/; do
    [ -f "$skill/SKILL.md" ] || continue
    name="$(basename "$skill")"
    rsync -aL --delete --exclude '.git' "$skill" "$REPO_DIR/$name/"
    synced+=("$name")
  done
done

# 3. Commit and push only if something actually changed
cd "$REPO_DIR"
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -q -m "sync skills from Mac ($(date +%Y-%m-%d))"
  git push
  echo ""
  echo "Pushed. Changed skills:"
  git show --stat --oneline HEAD | tail -n +2
else
  echo "Nothing new to sync. Repo already matches your Mac."
fi
echo ""
echo "Skills in repo now: $(ls -d "$REPO_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ')"
