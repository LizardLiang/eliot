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
| `capture: I think the new design is too cluttered` | Creates a note in `Notes/YYYY/` |
| `eliot, what's on my plate today?` | Daily review: tasks, due items, active projects |
| `eliot, last week` | Weekly review across 7 daily notes |
| `/eliot status` | Vault info, folder check, Profile.md status |
| `/eliot help` | Full capability list |

## First Run

On first invocation Eliot sets up silently — detects your vault, creates `Eliot/Profile.md` with defaults, and writes a setup record. No wizard, no blocking questions. You can customize anytime:

```
eliot, my name is Alex
eliot, my working hours are 9am to 6pm
eliot, remember that standup is at 10am every weekday
```

## Vault Structure

Eliot uses a canonical folder layout with sensible defaults. All paths are configurable in `Eliot/Profile.md`.

```
Obsidian vault/
├── Inbox/           — quick captures awaiting triage
├── Notes/YYYY/      — durable atomic notes
├── Projects/        — active multi-step initiatives
├── Plans/           — longer-running goals
├── Schedules/Daily/ — daily notes with checkbox tasks
└── Eliot/           — Profile.md, README.md
```

## Testing

```bash
npm install @anthropic-ai/claude-agent-sdk
node test-eliot.mjs
```
