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
node test-templates.mjs
node test-dual-link.mjs
```

Each script installs the skill into `.claude/skills/eliot/` from the repo-root `SKILL.md`/`reference.md`/`examples/dialogues.md` before running, and removes that install directory afterward (pass or fail) — it's a disposable build artifact, never hand-edit it, and it should never survive a test run.

## Release

1. **Bump the version** — the frontmatter `version:` field in `SKILL.md` is the single source of truth. Every other in-file mention (sentinel content, `/eliot status` output, `reference.md` §3.2) reads `<version from frontmatter>` and needs no manual edit.
2. **Run the eval suite** (also refreshes and then removes `.claude/skills/eliot/`):
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
