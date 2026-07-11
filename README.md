# agent-skills

A private, central repository of agent skills — kept in one place and shared
across every project and every agent (Claude Code, Cursor, etc.) without being
committed into any project's git history.

Each skill is a folder under `skills/` containing a `SKILL.md` (plain-markdown
instructions) plus any supporting scripts or resources.

## Using these skills across projects

These skills are meant to be *pointed at* via symlinks, not copied into each
project. That keeps a single source of truth here and keeps project repos clean.

```bash
# Point an agent's personal skills directory at this repo's skills/ folder.
# Back up any existing directory first if it is non-empty.
ln -s ~/Dev/agent-skills/skills ~/.claude/skills      # Claude Code (all projects)
ln -s ~/Dev/agent-skills/skills ~/.cursor/rules       # Cursor (adjust to its path/format)
```

If an agent needs a *project-local* skills path inside a repo, symlink it there
and add it to your global gitignore so it never gets committed:

```bash
git config --global core.excludesFile ~/.gitignore_global
echo ".claude/skills" >> ~/.gitignore_global
```

## Editing

Edit skills here, commit, and every agent/project that symlinks this folder sees
the change immediately. Push to keep an off-machine backup and sync across your
own machines.
