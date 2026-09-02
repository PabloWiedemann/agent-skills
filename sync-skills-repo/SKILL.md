---
name: sync-skills-repo
description: Sync every skill installed on this Mac (~/.agents/skills, ~/.cursor/skills, ~/.claude/skills — including anything added with `npx skills add`) into Pablo's private GitHub repo PabloWiedemann/agent-skills and push it, so Cursor cloud agents can download the same skills. Use whenever Pablo says "sync my skills", "push my skills", "update the skills repo", "I installed a new skill", or mentions running npx skills add.
---

# Sync skills repo

Run the bundled script and show Pablo the result:

```bash
bash "$(dirname "$0")/sync.sh" 2>&1 || bash ~/.claude/skills/sync-skills-repo/sync.sh 2>&1
```

Then tell him, in one or two lines:
- which skills were added or updated (from the "Changed skills" list), or that nothing changed
- whether the push succeeded

If the push fails with an authentication error, tell him to open Terminal, run `gh auth login`, follow the prompts, and then say "sync my skills" again.

Never edit the contents of any skill. Never delete anything from ~/.agents/skills, ~/.cursor/skills, or ~/.claude/skills.
