#!/usr/bin/env bash
# Lists skills installed on this Mac that are not yet decided (not in allowlist.txt or rejected.txt).
# Output: one line per skill:  name <TAB> description (from SKILL.md frontmatter)
set -eo pipefail
DIR="$(dirname "$0")"
decided() { grep -hv '^[[:space:]]*#' "$DIR/allowlist.txt" "$DIR/rejected.txt" 2>/dev/null | sed 's/[[:space:]]*$//' | grep -v '^$' | grep -qx "$1"; }
seen=""
for src in "$HOME/.agents/skills" "$HOME/.cursor/skills" "$HOME/.claude/skills"; do
  [ -d "$src" ] || continue
  for skill in "$src"/*/; do
    [ -f "$skill/SKILL.md" ] || continue
    name="$(basename "$skill")"
    case " $seen " in *" $name "*) continue;; esac
    seen="$seen $name"
    decided "$name" && continue
    desc="$(grep -m1 -i '^description:' "$skill/SKILL.md" | sed 's/^[Dd]escription:[[:space:]]*//; s/^["'"'"']//; s/["'"'"']$//' | cut -c1-200)"
    printf '%s\t%s\n' "$name" "${desc:-(no description)}"
  done
done
