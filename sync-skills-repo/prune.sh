#!/usr/bin/env bash
# Removes every skill NOT in allowlist.txt from ~/.agents/skills, ~/.cursor/skills, ~/.claude/skills.
# Shows what it would delete and asks before doing anything. Run: bash ~/.claude/skills/sync-skills-repo/prune.sh
set -eo pipefail
ALLOWLIST="$(dirname "$0")/allowlist.txt"
[ -f "$ALLOWLIST" ] || { echo "No allowlist.txt next to prune.sh"; exit 1; }
ALLOWED=()
while IFS= read -r line; do ALLOWED+=("$line"); done < <(grep -v '^[[:space:]]*#' "$ALLOWLIST" | sed 's/[[:space:]]*$//' | grep -v '^$')
# always keep the sync skill itself
ALLOWED+=("sync-skills-repo")

TO_DELETE=()
for src in "$HOME/.agents/skills" "$HOME/.cursor/skills" "$HOME/.claude/skills"; do
  [ -d "$src" ] || continue
  for entry in "$src"/*/ "$src"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue
    name="$(basename "$entry")"
    [ -d "$entry" ] || [ -L "$entry" ] || continue
    printf '%s\n' "${ALLOWED[@]}" | grep -qx "$name" && continue
    TO_DELETE+=("${entry%/}")
  done
done
# de-duplicate
UNIQ=()
while IFS= read -r line; do UNIQ+=("$line"); done < <(printf '%s\n' "${TO_DELETE[@]}" | sort -u)
TO_DELETE=("${UNIQ[@]}")

if [ "${#TO_DELETE[@]}" -eq 0 ]; then echo "Nothing to prune."; exit 0; fi
echo "Will delete ${#TO_DELETE[@]} skill folders/shortcuts not in the allowlist. First 20:"
printf '  %s\n' "${TO_DELETE[@]:0:20}"
read -r -p "Type YES to delete them: " answer
[ "$answer" = "YES" ] || { echo "Cancelled."; exit 0; }
for p in "${TO_DELETE[@]}"; do rm -rf "$p"; done
echo "Done. Remaining:"
for src in "$HOME/.agents/skills" "$HOME/.cursor/skills" "$HOME/.claude/skills"; do
  [ -d "$src" ] && echo "  $src: $(ls "$src" | wc -l | tr -d ' ')"
done
