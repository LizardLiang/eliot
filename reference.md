# Eliot — Reference

This file is loaded by `SKILL.md` on demand. It contains: verified obsidian CLI catalog, classification tables, vault-layout schemas, reconciliation rules, Profile.md schema, templates, and operational procedures.

---

## §CLI Verification

Verified against `~/.claude/plugins/cache/obsidian-skills/obsidian/1.0.1/skills/obsidian-cli/SKILL.md` (2026-05-13). Re-verify before each release via Appendix B.3 script.

| # | Subcommand | Status | Notes |
|---|---|---|---|
| 1 | `obsidian vault` | VERIFIED | Returns active vault name + path |
| 2 | `obsidian vaults` | VERIFIED | Lists all registered vaults |
| 3 | `obsidian search query="<q>" [path="<p>"] [limit=<n>] [format=json]` | VERIFIED | Text/regex search; scope to folder via path= |
| 4 | `obsidian read path="<p>"` | VERIFIED | Exact-path read (vault-rooted). Use path= for Eliot-internal files (not file= wikilink) |
| 4b | `obsidian read file="<name>"` | VERIFIED | Wikilink-resolution read; use only for user-content reads where wikilink resolution is intentional |
| 5 | `obsidian backlinks file="<p>"` | VERIFIED | Lists backlinks to a file |
| 6 | `obsidian tasks daily todo` | VERIFIED | not used — follows plugin folder, may escape root. Replaced by `obsidian read path="<schedules_daily>/<today>.md"` + extracting `- [ ]` lines |
| 7 | `obsidian tasks todo [verbose] [format=json]` | VERIFIED | All open tasks across vault |
| 8 | `obsidian property:get name="<n>" file="<p>"` | VERIFIED | Read a frontmatter property |
| 9 | `obsidian daily:read` | VERIFIED | not used — follows plugin folder, may escape root. Replaced by `obsidian read path="<schedules_daily>/<date>.md"` |
| 10 | `obsidian eval code="<js>"` | VERIFIED | Runs JS in Obsidian renderer context. NOT pre-approved — destructive potential. Requires per-invocation approval. Use only for: (a) folder existence probe, (b) §Tidy Strays file moves via `app.fileManager.renameFile`. Daily-notes plugin config is no longer queried (§A3). |
| 11 | `obsidian create name="<n>" [path="<p>"] [content="<c>"] [silent] [overwrite]` | VERIFIED | Creates a note. `silent` = no auto-open. `overwrite` = replace existing. NOT pre-approved. |
| 12 | `obsidian append file="<n>" content="<c>"` or `path="<p>"` | VERIFIED | Appends text to existing file. NOT pre-approved. |
| 13 | `obsidian daily:append content="<c>"` | VERIFIED | not used — follows plugin folder, may escape root. Replaced by `obsidian append path="<schedules_daily>/<date>.md"` |
| 14 | `obsidian property:set name="<n>" value="<v>" file="<p>"` | VERIFIED | Sets a frontmatter property. NOT pre-approved. |
| 15 | `obsidian template:read name="<t>"` | VERIFIED | Reads a template body |
| 16 | `obsidian template:insert name="<t>" path="<p>"` | VERIFIED | Inserts template into file. NOT pre-approved. |
| — | `obsidian search:context` | NOT VERIFIED | Not in verified CLI surface; NOT in allowed-tools. Use per-invocation approval if needed. |
| — | `obsidian tags sort=count counts` | VERIFIED | Tag list with counts |
| — | `obsidian aliases file="<p>"` | VERIFIED | Lists aliases for a file |
| — | `obsidian wordcount file="<p>"` | VERIFIED | Word count |
| — | `obsidian workspace` | VERIFIED | Workspace info |

**Daily review CLI allocation (≤ 3 calls):**
1. `obsidian read path="<schedules_daily>/<today>.md"` — extract open checkbox lines (`- [ ]`) as today's tasks; replaces the plugin-coupled `tasks daily todo` subcommand (row 6 above, not used)
2. `obsidian search query="due: <today-YYYY-MM-DD>" format=json`
3. `obsidian search query="status/active" path="<projects>" format=json` — matches `tags: [project, status/active]` in frontmatter and legacy `#status/active` body text

**Weekly review CLI allocation (≤ 10 calls):**
- 7 × `obsidian read path="<schedules_daily>/<YYYY-MM-DD>.md"` (past 7 days)
- 1 × `obsidian search query="path:<projects> modified:7d" format=json`
- 1 × `obsidian search query="review-date: ..." path="<plans>"`
- 1 buffer

---

## §A1.2 — Synonym Table (Reconciliation)

Match is case-insensitive; ignore leading numeric, symbol, or emoji prefixes. Synonym matching applies to folders found **inside `<root>/`** — not at the vault root.

| Canonical | Synonyms |
|---|---|
| `Inbox` | Inbox, 00 - Inbox, 📥 Inbox, Capture, Quick Capture |
| `Notes` | Notes, Atomic Notes, Zettel, Slip-box, 📝 Notes, 1 - Notes |
| `Projects` | Projects, 🚀 Projects, Active Projects, 10 - Projects, 1 - Projects, PARA/1 Projects |
| `Plans` | Plans, Goals, Intentions, Areas, PARA/2 Areas |
| `Schedules/Daily` | Schedules/Daily, Daily Notes, Daily, Journal, 📅 Daily, Calendar/Daily |

---

## §A1.3 — vault_layout Schema

YAML block under `## Vault Layout` in `<root>/Profile.md`. Only present overrides take effect; missing keys fall back to canonical defaults.

Every folder placeholder (`<inbox>`, `<notes>`, `<projects>`, `<plans>`, `<schedules_daily>`) resolves to `<root>/<value>`. Profile.md lives at `<root>/Profile.md`. If `root` is empty, paths are vault-root-relative (legacy mode). Resolution is identical for reads (`obsidian read path=`, `obsidian search query="..." path=`, `obsidian backlinks`) and writes (`obsidian create`, `obsidian append`, `obsidian property:set`, `obsidian template:insert`) — no placeholder is ever used un-resolved on either side.

```yaml
vault_layout:
  root: "<path relative to vault root, default 'Eliot'; empty string = vault root (legacy)>"
  inbox: "<path relative to <root>, default 'Inbox'>"
  inbox_file: "<filename, default 'Inbox.md'>"
  notes: "<path relative to <root>, default 'Notes'>"
  notes_subdir_template: "<template, default 'YYYY'>"
  projects: "<path relative to <root>, default 'Projects'>"
  plans: "<path relative to <root>, default 'Plans'>"
  schedules_daily: "<path relative to <root>, default 'Schedules/Daily'>"
  schedules_daily_filename: "<strftime, default 'YYYY-MM-DD.md'>"
```

**§A1.4 — vault_layout Value Sanitization (eval-injection guard):**

Before interpolating any `vault_layout` value (including `root`) into an `obsidian eval code=` string:
1. Validate the value matches the pattern `^[A-Za-z0-9 _./\-]+$`.
2. If the value contains any character outside that set (quotes, backslashes, semicolons, pipes, backticks, newlines, or other JS metacharacters): **do not interpolate**. Instead, fall back to the canonical default for that key and warn the user: "Your vault path for `<key>` contains characters that can't be used in a folder check. Using the default `<canonical-default>` instead — you can correct this in Profile.md."
3. This rule applies to every path value interpolated into `obsidian eval code=` strings anywhere in Eliot's instructions.

---

## §A3 — Schedule Model (Daily-Notes Plugin Decoupled)

Schedules are checkbox tasks (`- [ ] HH:MM <item>`) in daily notes. Path is always `<schedules_daily>/YYYY-MM-DD.md` (resolved default: `Eliot/Schedules/Daily/YYYY-MM-DD.md`) — the Daily Notes plugin configuration is never consulted for Eliot writes; a plugin-configured folder outside `<root>/` is not adopted.

**Resolution procedure (runs lazily, first time a daily note is written):** follows the standard `SKILL.md §Reconciliation` steps 1–3 — exact folder name match, then synonym-table match ([§A1.2](#a12--synonym-table-reconciliation), row `Schedules/Daily`), then create-with-consent. No plugin `eval` call is made for this resolution.

**Existing plugin-adopted `schedules_daily` (pre-0.6.0 vaults):** if `<root>/Profile.md` `vault_layout.schedules_daily` still holds a value from a prior version's plugin adoption that resolves outside `<root>/`, it is corrected via `SKILL.md §Tidy Strays`, not at write time.

If both `<root>/Schedules/Daily/` and a plugin-configured `Daily Notes/` folder (outside `<root>/`) exist with content: surface the conflict during §Tidy Strays — "I see daily notes in two places — `Daily Notes/` (<N> files, outside `Eliot/`) and `Eliot/Schedules/Daily/` (<M> files). Move the outside ones into `Eliot/Schedules/Daily/`?" Do not merge automatically.

---

## §Tidy Strays — Procedure Detail

Full flow lives in `SKILL.md §Tidy Strays`. This section documents the detection heuristic and move mechanism referenced there.

**Stray detection heuristic:** a file directly under the vault root inside `Inbox`/`Inbox.md`, `Notes/`, `Projects/`, `Plans/`, or `Schedules/` (i.e. NOT already under `<root>/`) counts as an Eliot stray when its frontmatter has:
- `type` equal to one of: `permanent`, `decision`, `implementation`, `meeting`, `project`, `plan`, `daily`, AND
- an Eliot-authored `id` (`<YYYYMMDDHHmm>`, 12 digits), `created` (`<YYYY-MM-DD>`), or `date` (`<YYYY-MM-DD>`) key — the Meeting Note Template and Daily Note Stub Template use `date` instead of `id`/`created`, so this key must also be accepted or `meeting`/`daily` strays can never be detected.

Files without this frontmatter shape are left alone — they may be hand-authored and outside Eliot's remit. The user confirms the final move list regardless.

**Move mechanism:** the verified CLI has no dedicated move/rename subcommand (§CLI Verification). Use `obsidian eval code="app.fileManager.renameFile(<TFile>, '<new-path>')"` — this Obsidian API updates all wikilinks pointing to the moved file automatically. Resolve the `<TFile>` argument via `app.vault.getAbstractFileByPath('<stray-path>')` inside the same eval call. Sanitize every interpolated path (`<stray-path>` and `<new-path>`) per [§A1.4](#a14--vault_layout-value-sanitization-eval-injection-guard) before building the eval string — the same injection rule that governs folder-check evals applies here. §A1.4's "fall back to the canonical default" remediation does not apply here — a discovered stray path has no `vault_layout` key or default to fall back to. If a `<stray-path>` or `<new-path>` fails the §A1.4 character-set check, record that item's status as `failed`, skip it, and continue with the rest of the batch.

**Batch-execution rule (per-item status):** moves happen one item at a time; the batch never aborts because one item can't be moved. Each item ends in exactly one status — `moved`, `skipped-declined` (per-invocation approval for that item's `obsidian eval` was declined), `skipped-missing` (`app.vault.getAbstractFileByPath('<stray-path>')` returns null when the move is attempted — the file vanished between proposal and execution), or `failed` (the eval call errored after one retry, or the path failed the §A1.4 sanitization check). An item is retried at most once on error before being marked `failed`. These statuses feed the `SKILL.md §Tidy Strays` last-write entry (`items:[{from, to, status}, ...]`, mirroring the `bulk-triage` entry shape in [§3.3](#33--last-write-record-bulk-triage-entry-shape)) — the post-batch confirmation reports moved/skipped/failed counts, and the undo prompt offers only items with `status: moved`.

**Degraded mode:** if `obsidian eval` errors (app not running, eval disabled) or `app.fileManager` is unavailable before any move is attempted, do not attempt a raw filesystem move — Eliot never touches the filesystem directly (§Error Handling and Security). Print the confirmed move list as manual instructions instead. If `obsidian eval` becomes unavailable partway through a batch, mark every not-yet-attempted item `failed` rather than retrying or aborting the items already resolved, then proceed to recording the batch.

**Profile.md normalization:** if `vault_layout` in `<root>/Profile.md` contains a folder value that resolves outside `<root>/` (for example a stale plugin-adopted `schedules_daily` from a pre-0.6.0 version, per §A3), flag it in the same proposal and, on confirmation, correct it via the §7a rewrite procedure — never silently rewrite Profile.md.

---

## §C.1 — Classification Decision Procedure

Two-phase evaluation. Inbox is always-available fallback.

**Phase 1 — Tie-breaker pre-check (run FIRST, before any priority scan):**

| Step | Condition | Result |
|---|---|---|
| 5 (tie-breaker) | Content has BOTH an explicit date/time anchor AND a reference to an existing project (matches file in Projects/ by name or [[wikilink]]) | **schedule-item** with `[[<project-slug>]]` appended → stop, do not evaluate Phase 2 |

**Phase 2 — Priority scan (only if Phase 1 did not fire; first match wins):**

| Priority | Rule | Classified Type |
|---|---|---|
| 0.5 (check FIRST) | Content starts with or contains "meeting with", "call with", "sync with", "standup", "1:1", "catch-up with", "interview with" | **meeting** → create meeting note; run §Dual-Link Detection (meeting mode). If time anchor also present, additionally append `- [ ] HH:MM [[<meeting-slug>]]` to daily schedule |
| 1 | Content contains explicit date/time anchor (no meeting keywords) | **schedule-item** |
| 2 | Content begins with an action verb OR concrete noun implying a task — AND has no project reference AND no time anchor | **task** |
| 2.5 | Content contains "decided to", "decision:", "we chose", "went with", "implementation decision", "architecture decision", "note the decision", "record this decision", "chose to", "we're going with" — fires even when a project is also referenced | **decision** → create with Decision Note Template (frontmatter MUST have `type: decision` + `id: <YYYYMMDDHHmm>`); run §Dual-Link Detection (decision mode) |
| 2.6 | Content contains "add what we built", "add what we've built", "add what we've done", "add what we did", "note our implementation", "what we implemented", "document what we built", "add to notes under", "capture our progress", "log our work" — fires even when a project is also referenced | **implementation** → create with Implementation Note Template (frontmatter MUST have `type: implementation` + `id: <YYYYMMDDHHmm>`); run §Dual-Link Detection (implementation mode) |
| 3 | Content explicitly references an existing project (matches file in Projects/ by name or [[wikilink]]) | **project-update** → create note in `<notes>/<YYYY>/<slug>.md` with Note Template (with project link); append link to project's `## Notes`. Project files hold only metadata |
| 4 | Content is declarative/descriptive ≥ 20 words OR contains "I think", "note that", "TIL", "idea:" | **note** → create with Note Template (frontmatter MUST have `type: permanent` + `id: <YYYYMMDDHHmm>`); run §Dual-Link Detection (note mode) |
| 6 (fallback) | None of Rules 0.5–4 match | **inbox** |

---

## §C.2 — Type → Path Lookup

All `<placeholder>` paths below resolve to `<root>/<value>` (e.g., `<projects>` → `Eliot/Projects`). The **Resolved Default** column spells out the assumed-defaults form of the same path so no reader has to apply the prefix rule mentally.

| Type | Path | Resolved Default | Operation |
|---|---|---|---|
| meeting | `<notes>/<YYYY>/<slug>.md` | `Eliot/Notes/2026/1-1-with-alice.md` | create with meeting note template; run §Dual-Link Detection (meeting mode) — populates `attendees`, `projects`; if time anchor present, also appends `- [ ] HH:MM [[<slug>]]` to daily schedule |
| schedule-item | `<schedules_daily>/<target-date>.md` | `Eliot/Schedules/Daily/2026-05-14.md` | append `- [ ] HH:MM <content>` |
| task | `<schedules_daily>/<today>.md` | `Eliot/Schedules/Daily/2026-05-13.md` | append `- [ ] <content>` (no time) |
| decision | `<notes>/<YYYY>/<slug>.md` | `Eliot/Notes/2026/switch-from-redux-to-zustand.md` | create with Decision Note Template; if §Dual-Link Detection finds a project, use Decision Note Template (with project link) + append `- [[<decision-slug>]] — <one-line-summary>` to project's `## Decisions` section |
| implementation | `<notes>/<YYYY>/<slug>.md` | `Eliot/Notes/2026/budget-calc-refactor.md` | create with Implementation Note Template; if §Dual-Link Detection finds a project, use Implementation Note Template (with project link) + append `- [[<impl-slug>]] — <one-line-summary>` to project's `## Notes` section |
| project-update | `<notes>/<YYYY>/<slug>.md` | `Eliot/Notes/2026/picked-the-paint-eggshell-white.md` | create with Note Template (with project link); `related_project` already known — skip dual-link steps 1–3, run from step 3.5. Append `- [[<note-slug>]] — <one-line summary>` to `<projects>/<related_project>.md` under `## Notes` |
| note | `<notes>/<YYYY>/<slug>.md` | `Eliot/Notes/2026/borrow-checker-affine-types.md` | create with note template; if §Dual-Link Detection finds a project, use linked note template + append `- [[<note-slug>]] — <summary>` to project's `## Notes` |
| inbox | `<inbox>/<inbox_file>` | `Eliot/Inbox/Inbox.md` | append `- [YYYY-MM-DD HH:MM] <content>` |

---

## §C.3 — Classification Test Table (acceptance: ≥ 16/18)

Resolved Default Path assumes default `root=Eliot`, `notes_subdir_template=YYYY` → `2026`.

| # | Input | Rule | Expected Type | Expected Path | Resolved Default Path |
|---|---|---|---|---|---|
| 1 | "capture: call the dentist tomorrow at 9" | 1 | schedule-item | `<schedules_daily>/<tomorrow>.md` | `Eliot/Schedules/Daily/<tomorrow>.md` |
| 2 | "capture: pick up dry-cleaning Friday" | 1 | schedule-item | `<schedules_daily>/<Friday>.md` | `Eliot/Schedules/Daily/<Friday>.md` |
| 3 | "capture: email Mom" | 2 | task | `<schedules_daily>/<today>.md` | `Eliot/Schedules/Daily/<today>.md` |
| 4 | "capture: home-office-renovation: picked the paint, eggshell white" | 3 | project-update | `<notes>/<YYYY>/picked-the-paint-eggshell-white.md` (linked to `[[home-office-renovation]]`) AND `<projects>/home-office-renovation.md` under `## Notes` | `Eliot/Notes/2026/picked-the-paint-eggshell-white.md` AND `Eliot/Projects/home-office-renovation.md` |
| 5 | "capture: home-office-renovation needs to be done by next Friday" | 5 (tie) | schedule-item + project link | `<schedules_daily>/<next-Friday>.md` with `[[home-office-renovation]]` | `Eliot/Schedules/Daily/<next-Friday>.md` |
| 6 | "capture: idea: rust's borrow checker is basically affine types in disguise" | 4 | note | `<notes>/<YYYY>/borrow-checker-affine-types.md` | `Eliot/Notes/2026/borrow-checker-affine-types.md` |
| 7 | "capture: I think the new linter is faster because it skips type-check on unchanged files" | 4 | note | `<notes>/<YYYY>/<slug>.md` | `Eliot/Notes/2026/<slug>.md` |
| 8 | "capture: groceries" | 2 | task | `<schedules_daily>/<today>.md` | `Eliot/Schedules/Daily/<today>.md` |
| 9 | "capture: TIL pwsh has $null" | 4 | note | `<notes>/<YYYY>/<slug>.md` | `Eliot/Notes/2026/<slug>.md` |
| 10 | "capture: aksjdhkjasd" | 6 fallback | inbox | `<inbox>/<inbox_file>` | `Eliot/Inbox/Inbox.md` |
| 11 | "capture: meet Liang next Tuesday 2pm" | 1 | schedule-item | `<schedules_daily>/<next-Tuesday>.md` | `Eliot/Schedules/Daily/<next-Tuesday>.md` |
| 12 | "capture: send invoice to Acme" | 2 | task | `<schedules_daily>/<today>.md` | `Eliot/Schedules/Daily/<today>.md` |
| 13 | "capture: 1:1 with Alice" | 0.5 | meeting | `<notes>/<YYYY>/1-1-with-alice.md` | `Eliot/Notes/2026/1-1-with-alice.md` |
| 14 | "capture: sync with Bob tomorrow at 3pm" | 0.5 | meeting + schedule-item | `<notes>/<YYYY>/sync-with-bob.md` AND `<schedules_daily>/<tomorrow>.md` with `- [ ] 15:00 [[sync-with-bob]]` | `Eliot/Notes/2026/sync-with-bob.md` AND `Eliot/Schedules/Daily/<tomorrow>.md` |
| 15 | "capture: call with the design team about home-office-renovation" | 0.5 | meeting + project link | `<notes>/<YYYY>/call-with-design-team.md` with `projects: ["[[home-office-renovation]]"]` | `Eliot/Notes/2026/call-with-design-team.md` |
| 16 | "decided to switch from Redux to Zustand in the store layer — hooks API is cleaner and bundle is 40% smaller. Risk: team needs to learn new patterns" | 2.5 | decision | `<notes>/<YYYY>/switch-from-redux-to-zustand.md` with Decision Note Template | `Eliot/Notes/2026/switch-from-redux-to-zustand.md` |
| 17 | "decision: going with PostgreSQL over MongoDB for the home-office-renovation project — relational data fits better, easier to query across tables. Might need to revisit if write volume spikes" | 2.5 | decision + project link | `<notes>/<YYYY>/postgresql-over-mongodb.md` AND `<projects>/home-office-renovation.md` under `## Decisions` | `Eliot/Notes/2026/postgresql-over-mongodb.md` AND `Eliot/Projects/home-office-renovation.md` |
| 18 | "add what we built to notes under home-office-renovation — refactored the budget calc into a shared util at utils/budget.ts, cleaner now but watch the rounding on fractional costs" | 2.6 | implementation + project link | `<notes>/<YYYY>/budget-calc-refactor.md` with `type: implementation` AND `<projects>/home-office-renovation.md` under `## Notes` | `Eliot/Notes/2026/budget-calc-refactor.md` AND `Eliot/Projects/home-office-renovation.md` |

---

## §11.4 — Profile.md Section Schema (locked)

```markdown
# Profile

## Working Hours
- <e.g., 09:00–18:00 weekdays>

## Routines
- morning: <steps>
- evening: <steps>

## People
- <name>: <relationship, recurring context>

## Preferences
- name: <how Eliot addresses the user>
- default_capture_time: <HH:MM or unset>
- <other key: value>

## Recurring Projects
- <project-slug>: <one-line description>

## Vault Layout
```yaml
vault_layout:
  root: "Eliot"
  inbox: "Inbox"
  notes: "Notes"
  projects: "Projects"
  plans: "Plans"
  schedules_daily: "Schedules/Daily"
```
```

---

## §Greeting Template (§11.5)

| Time band (local) | Routine for band? | Greeting |
|---|---|---|
| 05:00–11:59 | Yes (morning) | "Morning, <name> — <one-line routine recap>. Want today's review?" |
| 05:00–11:59 | No | "Morning, <name>. Want today's review or to capture something?" |
| 12:00–17:59 | Yes (afternoon) | "Afternoon, <name> — <one-line recap>. Anything to capture?" |
| 12:00–17:59 | No | "Afternoon, <name>. What can I help with?" |
| 18:00–22:59 | Yes (evening) | "Evening, <name> — <one-line recap>. Want a wrap-up?" |
| 18:00–22:59 | No | "Evening, <name>. What can I help with?" |
| 23:00–04:59 | any | "Hey <name>. What do you need?" |
| Name unset | any | Drop "<name>"; template otherwise unchanged. |

---

## §7a — Profile.md vault_layout Rewrite Procedure

Used for any FR-007 update or remove operation on Profile.md sections. Same procedure applies to Working Hours, Routines, People, Preferences, and Recurring Projects when updating/removing (not appending).

1. `Bash(obsidian read path="<root>/Profile.md")` — read full current content.
2. Parse in memory (model is the YAML parser). Locate the target section/key.
3. Apply change: update key, remove key, or add key. Preserve every other section verbatim. Preserve trailing newline and exact section-header order from §11.4.
4. Show diff preview ≤ 12 lines (changed lines only):
   ```
   Profile.md update — preview:
     - <old line>
     + <new line>
   Apply? (yes / no / show full file)
   ```
5. On confirmation: `obsidian create name="Profile.md" path="<root>/Profile.md" content="<full-new-content>" overwrite` — destructive, NOT pre-approved. Two confirmation layers: Eliot's preview above + Claude Code tool approval.
6. Record in last-write record as `{ op: "overwrite-profile", content: "<full pre-write content>" }` for undo.

For append-style additions (new bullet under existing section): use `obsidian append path="<root>/Profile.md" content="\n- <bullet>"` — cheaper, no whole-file rewrite needed.

---

## §3.3 — Last-Write Record: Bulk-Triage Entry Shape

A bulk inbox triage occupies exactly ONE of the N=5 last-write slots:

```
{
  ts: "<ISO-8601>",
  op: "bulk-triage",
  batch_size: <N>,
  items: [
    { file: "<vault-relative-path>", op: "append", content: "<excerpt>" },
    { file: "<vault-relative-path>", op: "append", content: "<excerpt>" },
    ...
  ]
}
```

Undo for bulk-triage: "That was a triage of <N> items. Undo all of them, pick specific ones, or cancel?"

---

## §3.2 — Sentinel Write Procedure

Use Claude Code's `Write` tool with an absolute path. NOT shell redirection (`echo >`, `Set-Content`, `Out-File`).

1. Detect home directory: Windows = value of `$env:USERPROFILE`; macOS/Linux = value of `$HOME`.
2. Construct absolute path: `<home>/.eliot/onboarded` (Windows: `<USERPROFILE>\.eliot\onboarded`).
3. Write tool with that absolute path. Content (two lines terminated by newline):
   ```
   onboarded_at: <ISO-8601-timestamp>
   skill_version: 0.6.0
   ```
4. Claude Code's Write tool creates parent directories (`<home>/.eliot/`) automatically.
5. On subsequent invocations, use the `Read` tool (not Bash) to check existence.

**§3.2a — Dual-Sentinel State Decision Table:**

Both sentinels MUST be present to skip setup. Partial state is not silent continuation.

| Sentinel (`~/.eliot/onboarded`) | Profile.md (`<root>/Profile.md`) | Action |
|---|---|---|
| Absent | Absent | §Silent Setup (runs silently, then executes task) |
| Present | Present | §Session Open (normal) |
| Absent | Present | Partial state (c): offer sentinel-only recreate or full re-run |
| Present | Absent | Partial state (d): offer Profile.md-only recreate or full re-run |

---

## §Templates

### Project Template

```markdown
---
created: <YYYY-MM-DD>
type: project
status: active
area: "[[]]"
due:
tags: [project, status/active]
---

# <Project Name>

## Goal
[What does done look like?]

## Next Action
- 

## Tasks
- [ ] 

## Decisions

## Notes
```

### Plan Template

```markdown
---
created: <YYYY-MM-DD>
type: plan
status: active
project: "[[<project-slug>]]"
review-date: <YYYY-MM-DD>
tags: [plan]
---

# <Plan Title>

## Goal
<one-line goal>

## Steps
- [ ] 

## Related Project
[[<project-slug>]]

## Notes
```

### Daily Note Stub Template (minimal, created when daily note is missing)

```markdown
---
date: <YYYY-MM-DD>
type: daily
tags: [daily]
---

# <YYYY-MM-DD>

## Morning Intentions
- [ ] 

## Tasks
- [ ] 

## Notes

## Evening Reflection
```

### Meeting Note Template

Used when content begins with "meeting with", "call with", "sync with", "standup", "1:1", or similar.

```markdown
---
date: <YYYY-MM-DD>
type: meeting
attendees: []
projects: []
summary: ""
up: []
tags: [meeting]
---

# <Meeting Title>

## Attendees
- 

## Agenda

## Notes

## Decisions

## Action Items
- [ ] 
```

### Note Template

Used when §Dual-Link Detection finds no matching project.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: permanent
tags: []
aliases: []
up: []
related: []
says: ""
---

# <Title>

## The Idea

<content>

## Why It Matters

## Connections
- Supports: 
- Challenges: 
```

### Note Template (with project link)

Used when §Dual-Link Detection sets `related_project`. Includes `up` pointing to the project and a `## Related Project` section.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: permanent
tags: []
aliases: []
up:
  - "[[<project-slug>]]"
related: []
says: ""
---

# <Title>

## The Idea

<content>

## Why It Matters

## Connections
- Supports: 
- Challenges: 

## Related Project
[[<project-slug>]]
```

### Decision Note Template

Used when Rule 2.5 fires (content contains decision trigger keywords). Eliot fills sections from the user's message — does NOT ask for missing sections, leaves them blank.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: decision
status: accepted
tags: [decision]
up: []
related: []
says: ""
---

# <Decision Title>

## Context
<What situation led to this decision?>

## Decision
<What was decided — one clear statement.>

## Where
<Which files, components, or areas are affected?>

## Why
<The rationale — what made this the right call?>

## Trade-offs
<What do we give up or risk with this approach?>

## Future Considerations
<What might need revisiting later? What should a future reader watch out for?>
```

### Decision Note Template (with project link)

Used when §Dual-Link Detection (decision mode) sets `related_project`.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: decision
status: accepted
tags: [decision]
up:
  - "[[<project-slug>]]"
related: []
says: ""
---

# <Decision Title>

## Context
<What situation led to this decision?>

## Decision
<What was decided — one clear statement.>

## Where
<Which files, components, or areas are affected?>

## Why
<The rationale — what made this the right call?>

## Trade-offs
<What do we give up or risk with this approach?>

## Future Considerations
<What might need revisiting later? What should a future reader watch out for?>

## Related Project
[[<project-slug>]]
```

### Implementation Note Template

Used when Rule 2.6 fires (content contains implementation trigger phrases). Eliot fills sections from the user's message — does NOT ask for missing sections, leaves them blank.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: implementation
tags: [implementation]
up: []
related: []
says: ""
---

# <Implementation Title>

## What Was Built
<The change or feature, in plain terms.>

## Where
<Files, components, or areas affected.>

## Why
<The motivation — what problem does this solve?>

## What's Good
<Benefits: why this is the right shape, what works well.>

## Watch Out For
<Risks, gotchas, edge cases a future reader should know.>

## Next Steps
<Follow-ups or things left to do, if any.>
```

### Implementation Note Template (with project link)

Used when §Dual-Link Detection (implementation mode) sets `related_project`.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: implementation
tags: [implementation]
up:
  - "[[<project-slug>]]"
related: []
says: ""
---

# <Implementation Title>

## What Was Built
<The change or feature, in plain terms.>

## Where
<Files, components, or areas affected.>

## Why
<The motivation — what problem does this solve?>

## What's Good
<Benefits: why this is the right shape, what works well.>

## Watch Out For
<Risks, gotchas, edge cases a future reader should know.>

## Next Steps
<Follow-ups or things left to do, if any.>

## Related Project
[[<project-slug>]]
```

`<one-line summary>` for the project-side append = first sentence of the "What Was Built" section, truncated to ~80 characters.

### Dual-Link: Decision → Project-Side Append Format

Appended to `<projects>/<related_project>.md` when §Dual-Link Detection fires for a **decision**. Use `obsidian append` — never rewrite the whole project file.

Project **already has** `## Decisions` section:
```
- [[<decision-slug>]] — <one-line summary>
```

Project **has no** `## Decisions` section:
```

## Decisions
- [[<decision-slug>]] — <one-line summary>
```

`<one-line summary>` = first sentence of the Decision section content, truncated to ~80 characters.

### Dual-Link: Note → Project-Side Append Format

Appended to `<projects>/<related_project>.md` when §Dual-Link Detection fires for a **note**. Use `obsidian append` — never rewrite the whole project file.

Project **already has** `## Notes` section:
```
- [[<note-slug>]] — <one-line summary>
```

Project **has no** `## Notes` section (older projects missing the section):
```

## Notes
- [[<note-slug>]] — <one-line summary>
```

`<one-line summary>` = first sentence of note content, truncated to ~80 characters.

### Dual-Link: Meeting → Project-Side Append Format

Appended to `<projects>/<related_project>.md` when §Dual-Link Detection (meeting mode) fires. Use `obsidian append`.

Project **already has** `## Notes` section:
```
- [[<meeting-slug>]] — meeting <YYYY-MM-DD>: <one-line summary>
```

Project **has no** `## Notes` section:
```

## Notes
- [[<meeting-slug>]] — meeting <YYYY-MM-DD>: <one-line summary>
```

### §Dual-Link Detection — Meeting Mode

Runs after the meeting note file is created. Three goals: populate attendees, link project, schedule if time-anchored. Each write requires per-invocation approval.

**Step 1 — Extract attendees:**
Parse pattern "meeting with X", "call with X and Y", "1:1 with X" — extract names after "with". For each name: `obsidian search query="<name>" path="<notes>" limit=3`. If a matching People note exists, render as `[[<slug>]]`; otherwise use plain string. Populate via `obsidian property:set name="attendees" value='["<value>",...]' file="<meeting-slug>.md"`.

**Step 2 — Detect project and link:**
Extract project tokens from content (same logic as note-mode steps 1–3). If one match: `obsidian property:set name="projects" value='["[[<slug>]]"]' file="<meeting-slug>.md"`. Then append to project's `## Notes` section using the Meeting → Project-Side Append Format above.

**Step 3 — Schedule-item for time-anchored meetings:**
If content contains a time anchor: `obsidian append path="<schedules_daily>/<date>.md" content="- [ ] HH:MM [[<meeting-slug>]]"`.

**Confirm:** "Created `<path>`. Linked to [[<project-slug>]] and added to your <date> schedule." (omit any line that didn't fire)

---

### Eliot/README Template (written during onboarding)

```markdown
# Eliot — Vault Conventions

Eliot is a Claude Code skill that manages this vault through the obsidian CLI.

## Canonical Folder Layout

See Eliot/Profile.md `## Vault Layout` for this vault's specific folder mapping.

Default hierarchy (all under `<root>/`, default `Eliot/`):
- `Eliot/Inbox/` — quick captures awaiting triage
- `Eliot/Notes/<YYYY>/` — durable atomic notes
- `Eliot/Projects/` — active multi-step initiatives (each gets its own .md file)
- `Eliot/Plans/` — longer-running goals and intentions
- `Eliot/Schedules/Daily/<YYYY-MM-DD>.md` — daily notes with checkbox tasks
- `Eliot/Profile.md` — Eliot's own profile and vault config

## Capture Conventions

- `capture: <thought>` — Eliot classifies and files automatically
- Schedule items use checkbox format: `- [ ] HH:MM <item>`
- Project log entries: `- YYYY-MM-DD: <entry>` under `## Log`
- Notes go in `Eliot/Notes/<YYYY>/<slug>.md`

## Undo

Within the same Claude Code session: "undo that" or "undo the last capture".
Cross-session undo: use Obsidian Sync history or git.

## Profile

`Eliot/Profile.md` stores your name, working hours, routines, preferences, and vault layout overrides. Edit it directly or ask Eliot to remember, update, or forget facts.
```

---

## §Sentinel Path Table

| OS | Path |
|---|---|
| Windows | `%USERPROFILE%\.eliot\onboarded` (e.g., `C:\Users\<user>\.eliot\onboarded`) |
| macOS | `$HOME/.eliot/onboarded` (e.g., `/Users/<user>/.eliot/onboarded`) |
| Linux | `$HOME/.eliot/onboarded` (e.g., `/home/<user>/.eliot/onboarded`) |

The path is computed at runtime from environment variables. It is never hard-coded in SKILL.md.

---

## §Known Limits

- Last-write record is per-session only (lost on session end). Future enhancement: persist to `Eliot/.last-writes.log`.
- Multi-vault support (FR-030) is P2. v1 always uses the active vault.
- `obsidian search:context` is not in the verified CLI surface and is not pre-approved.
- `/eliot brief` and `/eliot wrap` are P2 features.
