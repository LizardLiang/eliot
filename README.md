# Eliot

A personal Obsidian assistant skill for Claude Code. Eliot captures notes, manages projects and plans, reviews your schedule, and remembers your routines — all through the local `obsidian` CLI.

## Install

```bash
npx skills add LizardLiang/eliot
```

## Requirements

- [Claude Code](https://claude.ai/code)
- [Obsidian](https://obsidian.md) running locally with the CLI enabled

## Usage

Once installed, invoke Eliot with `/eliot` or natural language:

| What you say | What Eliot does |
|---|---|
| `capture: buy groceries` | Files a task to today's daily note |
| `capture: call dentist Friday 3pm` | Schedules to Friday's daily note |
| `capture: I think X is slow because Y` | Creates a note in `Eliot/Notes/YYYY/` (substantive thoughts only — fleeting one-liners park in `Eliot/Inbox/` for triage) |
| `eliot, what's on my plate today?` | Daily review: tasks, due items, active projects |
| `eliot, last week` | Weekly review across 7 daily notes |
| `done: buy groceries` | Checks off the task in your daily note |
| `eliot, archive psmux` | Marks a project done (drops out of reviews) |
| `/eliot status` | Vault info, folder check, Profile.md status |
| `/eliot tidy` | Moves stray Eliot files back under `Eliot/` |
| `/eliot doctor` | Vault health check: broken links, duplicates, placeholder residue, stale projects |
| `/eliot help` | Full capability list |

## First Run

On first invocation Eliot sets up silently — detects your vault, creates `Eliot/Profile.md` with defaults, and writes a setup record. No wizard, no blocking questions. You can customize anytime:

```
eliot, my name is Alex
eliot, my working hours are 9am to 6pm
eliot, remember that standup is at 10am every weekday
```

## Vault Structure

Everything Eliot writes lives under a single root folder (default `Eliot/`) — nothing is scattered at the vault root. All paths are configurable in `Eliot/Profile.md`.

```
Obsidian vault/
└── Eliot/
    ├── Profile.md        — your profile + vault layout config
    ├── Inbox/Inbox.md    — quick captures awaiting triage
    ├── Notes/YYYY/       — durable atomic notes
    ├── Projects/         — active multi-step initiatives
    ├── Plans/            — longer-running goals
    └── Schedules/Daily/  — daily notes with checkbox tasks
```

## Testing

```bash
npm install @anthropic-ai/claude-agent-sdk
node test-eliot.mjs
```

Note: `test-eliot.mjs` deletes and regenerates `.claude/skills/eliot/` from the repo-root skill files on every run — that copy is a build artifact, never hand-edit it.

## Release

1. **Bump the version** — it appears in ~6 places; grep the old version string to catch all of them:
   ```bash
   grep -rn "<old-version>" SKILL.md reference.md
   ```
   (SKILL.md frontmatter, §Silent Setup sentinel content, §/eliot status ×3, reference.md §3.2.)
2. **Run the eval suite** (also refreshes `.claude/skills/eliot/`):
   ```bash
   node test-eliot.mjs
   ```
3. **Deploy the live copy** — `~/.claude/skills/eliot` is a symlink to `C:\Users\lizard_liang\.agents\skills\eliot\`; copy the payload files there:
   ```bash
   cp SKILL.md reference.md ~/.agents/skills/eliot/
   cp examples/dialogues.md ~/.agents/skills/eliot/examples/
   ```
4. **Verify**: in a fresh Claude Code session, `/eliot status` must report the new version.
5. **Commit**: `feat(eliot): <summary> (vX.Y.Z)`.
