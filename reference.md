# Eliot — Reference

This file is loaded by `SKILL.md` on demand. It contains: verified obsidian CLI catalog, classification tables, vault-layout schemas, reconciliation rules, Profile.md schema, templates, and operational procedures.

---

## §CLI Verification

Verified against `~/.claude/plugins/cache/obsidian-skills/obsidian/1.0.1/skills/obsidian-cli/SKILL.md` (2026-05-13). Re-verify before each release against the obsidian-cli skill doc at the path above.

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
| 10 | `obsidian eval code="<js>"` | VERIFIED | Runs JS in Obsidian renderer context. NOT pre-approved — destructive potential. Requires per-invocation approval. Use only for: (a) §Tidy Strays file moves via `app.fileManager.renameFile`, (b) §Doctor fixes via `app.fileManager.trashFile` (move to Obsidian trash — never hard delete). Never for read-only checks — status folder checks use `search`/`read` instead. Daily-notes plugin config is no longer queried (§A3). |
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

## §/eliot status — Procedure Detail

Response length cap (≤ 12 lines) lives in `SKILL.md §/eliot status`. Steps:
1. Version = `<version from frontmatter>`.
2. `Bash(obsidian vault)` → vault name + path.
3. Folder check via pre-approved read-only CLI — never `obsidian eval` (status is read-only; eval needs per-invocation approval and can mutate vault state). Per folder, all 5 subfolders (placeholders already root-resolved, `SKILL.md §Path Resolution`): `obsidian search query="path:<folder>" limit=1 format=json` — ≥ 1 result = present. 0 results → probe `obsidian read path="<folder>/.keep"` — readable = present (folder exists, no indexed notes). Both empty → report absent (accepted limit: an empty folder without `.keep` reads as absent; folders are created lazily with content). No [§A1.4](#a14--vault_layout-value-sanitization-eval-injection-guard) sanitization applies — nothing is interpolated into an eval string; configured paths pass to `search`/`read` arguments as-is.
4. `Bash(obsidian read path="<root>/Profile.md")`.
5. Return: `Eliot <version> / Vault: <name> (<path>) / Folders: ... / Profile.md: present|absent / You can ask me to: capture, daily review, search, project status, schedule, mark done, archive, update memory, undo last write, /eliot help.`

Onboarding fallback and the exact CLI-unavailable / app-not-running strings live in SKILL.md §/eliot status.

---

## §/eliot help — Category Reference

Length cap (≤ 25 lines) and the exact category names live in `SKILL.md §/eliot help`. One example phrase per category:

| Category | Example phrases |
|---|---|
| Capture & schedule | `capture:`, `schedule at` |
| Review | what's on my plate, last week, where did I write |
| Projects & plans | start project, project status, start plan |
| Lifecycle | `done: <task>`, archive `<project>` |
| Memory | `remember:`, update routine, forget |
| Maintenance | `/eliot status`, undo that, triage my inbox, `/eliot tidy`, `/eliot doctor` |

Plus `/eliot brief` and `/eliot wrap` (P2).

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

## §Reconciliation — Procedure Detail

Trigger rule and the "never silently create" invariant live in `SKILL.md §Reconciliation`. Runs lazily — only when a folder path is first needed for a write, never upfront at setup. For the folder about to be used:
1. Exact name match in vault → use it, no prompt.
2. No exact match → check the synonym table ([§A1.2](#a12--synonym-table-reconciliation), case-insensitive, ignores leading numeric/symbol/emoji prefixes).
   - One synonym match → adopt silently, update `vault_layout` in Profile.md (§7a rewrite), no prompt.
   - Multiple candidates or genuine ambiguity → ask user once: "I found `<candidate>` — use this for <folder>?"
3. No match → create folder with canonical name after user consents. Never silently create.
4. Record outcome in `<root>/Profile.md ## Vault Layout` ([§A1.3](#a13--vault_layout-schema)).

Daily-notes folder resolution is a special case of this same procedure — the "A3" case in [§A3](#a3--schedule-model-daily-notes-plugin-decoupled) below.

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

---

## §A1.4 — vault_layout Value Sanitization (eval injection guard)

Before interpolating any `vault_layout` value (including `root`) into an `obsidian eval code=` string:
1. Denylist check: reject the value iff it contains any of `'`, `"`, `\`, `` ` ``, `$`, `;`, or any control character (U+0000–U+001F, U+007F). All other characters — including CJK and any other Unicode script — pass; this guard does not restrict folder names to ASCII, and non-ASCII `vault_layout` values (e.g. `root: "筆記"`) are fully supported.
2. On rejection, **do not interpolate** that value into any eval string. The configured path itself remains authoritative for every non-eval CLI operation (`create`, `append`, `read`, `search path=`, `property:set`, `template:insert`) — never redirect a read or write to a default folder. Only the eval-based operation degrades:
   - Per-item eval operations (`renameFile`, `trashFile`) mark that item's status `failed` and continue the rest of the batch — the standard `SKILL.md §Tidy Strays` batch-execution rule.
   - Warn once per session: "Your vault path for `<key>` contains a character (`<char>`) that can't be used in an eval-based move or fix. The path itself is still used for reads and writes — only that move/fix is skipped. Correct it in Profile.md?" (offers the [§7a](#7a--profilemd-vault_layout-rewrite-procedure) correction flow).
3. Single-quote convention: every eval call site MUST wrap an interpolated path as a single-quoted JS string literal (e.g. `'<path>'`) — never double-quoted or unquoted. The denylist in rule 1 prevents injection only under this convention.
4. This rule applies to every path value interpolated into `obsidian eval code=` strings anywhere in Eliot's instructions.

---

## §A3 — Schedule Model (Daily-Notes Plugin Decoupled)

Schedules are checkbox tasks (`- [ ] HH:MM <item>`) in daily notes. Path is always `<schedules_daily>/YYYY-MM-DD.md` (resolved default: `Eliot/Schedules/Daily/YYYY-MM-DD.md`) — the Daily Notes plugin configuration is never consulted for Eliot writes; a plugin-configured folder outside `<root>/` is not adopted.

**Resolution procedure (runs lazily, first time a daily note is written):** follows the standard [§Reconciliation](#reconciliation--procedure-detail) steps 1–3 — exact folder name match, then synonym-table match ([§A1.2](#a12--synonym-table-reconciliation), row `Schedules/Daily`), then create-with-consent. No plugin `eval` call is made for this resolution.

**Existing plugin-adopted `schedules_daily` (pre-0.6.0 vaults):** if `<root>/Profile.md` `vault_layout.schedules_daily` still holds a value from a prior version's plugin adoption that resolves outside `<root>/`, it is corrected via `SKILL.md §Tidy Strays`, not at write time.

If both `<root>/Schedules/Daily/` and a plugin-configured `Daily Notes/` folder (outside `<root>/`) exist with content: surface the conflict during §Tidy Strays — "I see daily notes in two places — `Daily Notes/` (<N> files, outside `Eliot/`) and `Eliot/Schedules/Daily/` (<M> files). Move the outside ones into `Eliot/Schedules/Daily/`?" Do not merge automatically.

---

## §Tidy Strays — Procedure Detail

Trigger phrases and the "never fall back to filesystem move" invariant live in `SKILL.md §Tidy Strays`. Full numbered flow:

1. **Scan for strays.** A file directly under the vault root inside `Inbox`/`Inbox.md`, `Notes/`, `Projects/`, `Plans/`, or `Schedules/` (i.e. NOT already under `<root>/`) counts as an Eliot stray when its frontmatter has: `type` equal to one of `permanent`, `decision`, `implementation`, `meeting`, `project`, `plan`, `daily`, AND an Eliot-authored `id` (`<YYYYMMDDHHmm>`, 12 digits), `created` (`<YYYY-MM-DD>`), or `date` (`<YYYY-MM-DD>`) key — the Meeting Note Template and Daily Note Stub Template use `date` instead of `id`/`created`, so this key must also be accepted or `meeting`/`daily` strays can never be detected. Files without this frontmatter shape are left alone — they may be hand-authored and outside Eliot's remit. The user confirms the final move list regardless.
2. **Check vault_layout too.** Read `<root>/Profile.md` `vault_layout` and check whether any folder value resolves outside `<root>/` (e.g. a pre-0.6.0 plugin-adopted `schedules_daily`, per §A3). Flag it for correction alongside the stray files.
3. **Propose the move list.** A single numbered list: `<N>. <stray-path> → <root>/<target-subpath>` (e.g. `Notes/2026/foo.md → Eliot/Notes/2026/foo.md`), where `<target-subpath>` is the [§C.2](#c2--type--path-lookup) type→path mapping with its `<root>/` prefix stripped — §C.2's paths already resolve to `<root>/...`, so do not prefix a second time. Wait for confirmation before any write.
4. **Move mechanism.** On bulk confirm, move each file **one at a time** — the verified CLI has no dedicated move/rename subcommand (§CLI Verification). Use `obsidian eval code="app.fileManager.renameFile(<TFile>, '<new-path>')"` (per-invocation approval) — this Obsidian API updates all wikilinks pointing to the moved file automatically. Resolve the `<TFile>` argument via `app.vault.getAbstractFileByPath('<stray-path>')` inside the same eval call. Sanitize every interpolated path (`<stray-path>` and `<new-path>`) per [§A1.4](#a14--vault_layout-value-sanitization-eval-injection-guard) before building the eval string — the standard eval injection rule, including the single-quote convention. If a path fails the §A1.4 denylist check, record that item's status as `failed`, skip it, and continue with the rest of the batch.
   **Batch-execution rule (per-item status):** moves happen one item at a time; the batch never aborts because one item can't be moved. Each item ends in exactly one status — `moved`, `skipped-declined` (per-invocation approval for that item's `obsidian eval` was declined), `skipped-missing` (`app.vault.getAbstractFileByPath('<stray-path>')` returns null when the move is attempted — the file vanished between proposal and execution), or `failed` (the eval call errored after one retry, or the path failed the §A1.4 sanitization check). An item is retried at most once on error before being marked `failed`.
5. **Vault_layout correction.** If step 2 flagged a `vault_layout` value, propose its correction via the §7a rewrite procedure — never silently rewrite Profile.md.
6. **Record and confirm.** Record the whole batch as ONE journal entry (`{ ts, vault, op:"tidy-strays", batch_size, items:[{from, to, status}, ...] }`, mirroring the `bulk-triage` entry shape in [§3.3](#33--last-write-journal-file-format-and-entry-shapes)). Confirm with per-status counts: "Moved <M>, skipped <S>, failed <F> of <N>." Undo prompt (only if M > 0): "Undo the <M> moved files, pick specific ones, or cancel?" — undo offers only items with `status: moved`; skipped/failed items are not undo candidates.
7. **Degraded mode.** If `obsidian eval` is unavailable or the app isn't running before any move is attempted, do not fall back to a filesystem move (§Error Handling and Security) — degrade to printing the confirmed move list for manual action. If `obsidian eval` becomes unavailable partway through the batch, mark every not-yet-attempted item `failed`, stop attempting further moves, and proceed to step 6 with the statuses gathered so far.

Empty-state string lives in SKILL.md §Tidy Strays.

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
| 2.5 | Content **records a choice that was made** — the utterance's point is committing to an option (possibly among alternatives), stated as already decided. Judge by meaning, not keyword match; e.g. "decided to…", "decision: going with X over Y", "we chose…" are illustrative, and paraphrases or other languages carrying the same meaning fire too — fires even when a project is also referenced | **decision** → create with Decision Note Template (frontmatter MUST have `type: decision` + `id: <YYYYMMDDHHmm>`); run §Dual-Link Detection (decision mode) |
| 2.6 | Content **reports completed work** — the point is documenting what was built/implemented/changed, after the fact. Judge by meaning, not keyword match; e.g. "add what we built…", "log our work", "we implemented X" are illustrative, paraphrases and other languages fire too. Distinguish from Rule 2 (task = work still to do) and Rule 2.5 (choice made vs work done) — fires even when a project is also referenced | **implementation** → create with Implementation Note Template (frontmatter MUST have `type: implementation` + `id: <YYYYMMDDHHmm>`); run §Dual-Link Detection (implementation mode) |
| 3 | Content explicitly references an existing project (matches file in Projects/ by name or [[wikilink]]) | **project-update** → create note in `<notes>/<YYYY>/<slug>.md` with Note Template (with project link); append link to project's `## Notes`. Project files hold only metadata |
| 4 | Content is declarative/descriptive AND passes the **substance gate** below | **note** → create with Note Template (frontmatter MUST have `type: permanent` + `id: <YYYYMMDDHHmm>`); run §Dual-Link Detection (note mode) |
| 6 (fallback) | None of Rules 0.5–4 match, or Rule 4 fired but the substance gate failed | **inbox** |

**Rule 4 substance gate:** a declarative thought becomes a permanent note only if it states an idea AND at least one of: (i) a reason or mechanism ("because", "since", cause→effect reasoning), (ii) an explicit connection to another topic, note, or project, (iii) ≥ ~25 words of elaboration. Explicit markers "TIL", "idea:", "note:" always qualify — the user's intent is explicit. **Gate fails** → route to inbox (Rule 6 mechanics) and confirm: "Parked in Inbox — say 'make it a note' to promote." On "make it a note" (or "promote #N"), create the permanent note from the inbox line via the Note Template, then remove the inbox line (both writes approved).

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

## §Dual-Link Detection — Procedure Detail

When it runs and the "unverified project reference NEVER becomes a wikilink" invariant live in `SKILL.md §Dual-Link Detection`. Runs inside §Capture Flow when classification is **project-update** (Rule 3), **decision** (Rule 2.5), **implementation** (Rule 2.6), **note** (Rule 4), or **meeting** (Rule 0.5). Steps 1–5 below are shared; each mode lists only its deltas.

**Project-update mode (Rule 3):** `related_project` is already known from the classification match — skip steps 1–3 entirely. Use Note Template (with project link); project-side append targets `## Notes` section using the Dual-Link: Note → Project-Side Append Format.

**Decision mode:** use Decision Note Template (with project link when `related_project` is set); project-side append targets `## Decisions` section using the Dual-Link: Decision → Project-Side Append Format from `§Templates`.

**Implementation mode:** use Implementation Note Template (with project link when `related_project` is set); project-side append targets `## Notes` section using the Dual-Link: Note → Project-Side Append Format — `- [[<slug>]] — <one-line summary>`.

**Step 1 — Extract project tokens from content:**
- Explicit `[[wikilinks]]` — extract the wikilink target.
- Capitalized noun phrases (2–3 words).
- Text after patterns: `for|in|on|about <X> project` or `the <X> project`.

**Step 2 — Search Projects/ folder:**
For each candidate token: `Bash(obsidian search query="<token>" path="<projects>" format=json limit=5)`.

**Step 3 — Decide:**
- **Exactly one match** → set `related_project = <matched-slug>`; continue silently.
- **Multiple matches** → ask once: "I found `<a>`, `<b>` — link this note to which project?" Wait for answer before writing.
- **No match, project NOT explicitly named** → `related_project` unset; use standard note template; skip steps 4–5.
- **No match, but the user explicitly named a project** (prefix `<name>:`, "the <X> project", explicit `[[wikilink]]`) → ask once: "No project `<slug>` yet — create `Eliot/Projects/<slug>.md` and link, or capture without a link?" Create → Project Template (+ §Create Guard), then proceed as project-update. Decline → plain-text mention, `up: []`.

**Step 3.5 — Fill `says` and `up` before writing:**
- `says`: derive from the first sentence of the note content, truncated to ~120 chars. If no meaningful first sentence exists, leave it empty — never invent content.
- `up`: if `related_project` is set, populate `up: ["[[<project-slug>]]"]`. If not, ask once: "Which topic area does this note belong to? (e.g. `[[Machine Learning MOC]]`, or press Enter to leave blank)". One question, optional — never block the write waiting for it. If the answer names a target that doesn't resolve (`obsidian read` fails), confirm before writing it dangling: "`[[<target>]]` doesn't exist yet — link anyway, or leave blank?"

**Step 4 — Note side:**
When `related_project` is set, use the linked note template — it includes a `## Related Project\n[[<project-slug>]]` section at the bottom.

**Step 5 — Project side (runs after note is created, requires per-invocation approval):**
- `<one-line summary>` = first sentence of note content, truncated to ~80 chars.
- Project **has** a `## Notes` section: `obsidian append path="<projects>/<related_project>.md" content="\n- [[<note-slug>]] — <one-line summary>"`
- Project **has no** `## Notes` section: `obsidian append path="<projects>/<related_project>.md" content="\n## Notes\n- [[<note-slug>]] — <one-line summary>"`
- Never rewrite the whole project file for this operation — always use `obsidian append`.

**Last-write record for dual-link:** occupies one journal entry — entry shape and undo prompt in [§3.3](#33--last-write-journal-file-format-and-entry-shapes).

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

## §Create Guard — Pre-Create Existence Check

Before ANY `obsidian create` (except the intentional `overwrite` in §7a), probe the exact target: `obsidian read path="<target>"` (pre-approved, exact-path, one call). `obsidian create` silently auto-suffixes on collision (`X 1.md`) — treated as a bug; the guard prevents it.

On hit (read succeeds → file exists), by target type:
- **Project / plan** → never create. Ask once: "`<slug>` already exists — update it, view it, or pick a different name?"
- **Note** → de-collide silently: append `-<HHmm>` to the slug, mention the adjusted name in the confirmation.
- **Daily note** → it exists; skip creation and append (the normal path).

On miss (read errors → file absent) → proceed with `obsidian create` as planned.

---

## §Lifecycle — Procedure Detail

**Task done** (triggers in `SKILL.md §Lifecycle`):
1. Locate the task line: read `<schedules_daily>/<today>.md`; not found → scan back up to 7 prior daily notes (1 read each); still not found → fallback `obsidian tasks todo` to name where it lives.
2. Exactly one `- [ ]` match → rewrite that daily note flipping the line to `- [x]` via `obsidian create name="<file>" path="<schedules_daily>/<date>.md" content="<full-new-content>" overwrite` (daily notes are small; destructive → show the one-line diff + per-invocation approval). Record to the persisted journal (SKILL.md §Last-Write Record) as { ts, vault, file, op:"task-done", content:"<pre-write content>" } — the pre-write content is the daily note read in step 1 of this same flow, never reconstructed.
3. Multiple matches → ask which one. No match → "I can't find an open task matching `<x>` in the last 7 days."

**Project archive** (triggers in `SKILL.md §Lifecycle`):
1. Confirm: "Archive `<project>` — mark status done?"
2. Three `property:set` calls (per-invocation approval, no file move, no whole-file rewrite):
   - `obsidian property:set name="status" value="done" file="<projects>/<slug>.md"`
   - `obsidian property:set name="tags" value='["project","status/done"]' file="<projects>/<slug>.md"`
   - `obsidian property:set name="completed" value="<YYYY-MM-DD>" file="<projects>/<slug>.md"`
3. Payoff: the project drops out of §Daily Review's `status/active` search automatically. Confirm: "Archived `<slug>` — it won't show in daily reviews."

---

## §Doctor — Check Catalog

Full flow in `SKILL.md §/eliot doctor`. Scan is read-only; every fix requires per-invocation approval. Batch semantics reuse the §Tidy Strays batch-execution rule verbatim (per-item status `fixed` | `skipped-declined` | `skipped-missing` | `failed`, one retry max, never abort the batch over one item). The whole run records as ONE journal entry (§Last-Write Record): { ts, vault, op:"doctor", batch_size, items:[{check, target, action, status}, ...] }.

| # | Check | Detection | Fix (on user pick) |
|---|---|---|---|
| 1 | Broken wikilinks | In Eliot-authored files (`up:` frontmatter — plus `related:` in pre-0.10 notes —, schedule lines, project `## Notes`/`## Decisions` entries): extract `[[target]]`, probe `obsidian read path=`/`file=` for each unique target | Per missing-project policy (SKILL.md §Dual-Link step 3): create the target project (Project Template + §Create Guard) / convert link to plain text / leave as-is |
| 2 | Duplicate files | Sibling `<name> 1.md` beside `<name>.md` (create auto-suffix pattern) in `<projects>`, `<plans>`, `<notes>` | Show both; user picks canonical; append the other's non-empty body under `## Merged from <dupe>` in the canonical file; trash dupe via `obsidian eval code="app.fileManager.trashFile(app.vault.getAbstractFileByPath('<path>'))"` (Obsidian trash — recoverable, never hard delete; §A1.4 sanitization applies) |
| 3 | Placeholder residue | Literal `[What does done look like?]`, `area: "[[]]"`, empty REQUIRED sections (`## Goal` with no body), bare `- [ ] ` / `- ` stubs | Fill now (ask one question) or strip the placeholder/stub (file rewrite via `create ... overwrite`, diff preview first) |
| 4 | Stale-active projects | `status/active` projects unmodified > 30 days (`obsidian search query="path:<projects> modified:30d"` inverted, or read `created`/mtime) | Offer the §Lifecycle project-archive flow per project |
| 5 | Root artifacts | 0-byte `.md` files at vault root; empty vault-root folders with canonical names (`Projects/`, `Notes/`, …); non-md files inside Eliot folders | 0-byte/empty → offer trash via `trashFile`. Non-md artifacts (e.g. `.py`) → REPORT ONLY, Eliot never moves non-vault files. Eliot-frontmattered strays → "run `/eliot tidy`" (don't duplicate tidy logic) |
| 6 | Profile.md schema | Content after the `## Vault Layout` YAML block (corruption — layout must be the final section, §11.4); missing canonical `vault_layout` keys; section order drift from §11.4 | Offer §7a repair: relocate stray content into its correct section, restore key/section order, add missing keys with defaults — one rewrite, diff preview first |

Report format: numbered findings grouped by check, then "Fix which? (all / #s / none)". Zero writes before the user picks.

---

## §C.3 — Classification Test Table (acceptance: ≥ 19/21)

Resolved Default Path assumes default `root=Eliot`, `notes_subdir_template=YYYY` → `2026`. Rows 6/7/9 pass the Rule 4 substance gate ("idea:" marker / "because" clause / "TIL" marker) and produce a **lean note** — frontmatter + `## The Idea` only, no empty optional sections.

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
| 19 | "capture: I think mondays are the worst" | 4→6 (gate fail) | inbox | `<inbox>/<inbox_file>` — fails substance gate (no reason, no connection, < 25 words); confirm offers promotion | `Eliot/Inbox/Inbox.md` |
| 20 | "done: buy groceries" | — (not a capture) | lifecycle: task done | flip `- [ ] buy groceries` → `- [x] buy groceries` in the daily note where it lives (§Lifecycle) | `Eliot/Schedules/Daily/<date>.md` |
| 21 | "capture: sippos: fixed the login bug" (no `<projects>/sippos.md` exists) | 3 (unverified ref) | offer-to-create | ask "No project `sippos` yet — create `Eliot/Projects/sippos.md` and link, or capture without a link?" — NEVER silently write `[[sippos]]` | `Eliot/Projects/sippos.md` (only on consent) |

---

## §11.4 — Profile.md Section Schema (locked)

`## Vault Layout` MUST remain the final section — any content after its YAML block is corruption (§Doctor check 6 repairs it). New facts are inserted into their section via the §7a rewrite, never appended to the file.

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

Used for any update or remove operation on Profile.md sections. Same procedure applies to Working Hours, Routines, People, Preferences, and Recurring Projects when updating/removing (not appending).

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
6. Record to the persisted journal at `<home>/.eliot/last-writes.json` (`SKILL.md §Last-Write Record`) as `{ ts, vault, op: "overwrite-profile", content: "<full pre-write content>" }` for undo — the pre-write content is exactly the content read from disk in step 1 of this same flow, never reconstructed.

**§7a is the ONLY write path for Profile.md — including new facts.** `obsidian append` writes to end-of-file only, and `## Vault Layout` is locked as the final section (§11.4), so an appended bullet always lands after the YAML block and corrupts the schema. Never `obsidian append` to Profile.md.

---

## §Silent Setup — Procedure Detail

Trigger ("both sentinels absent") and the "MUST complete all steps before the task" rule live in `SKILL.md §Silent Setup`. Step-by-step:

**Voice-rule exemption:** the three bootstrap writes below — Profile.md creation (Step 3), the `.keep` folder-creation fallback (Step 3), and the sentinel write (Step 4) — are the first-run exemption named in §Identity and Voice; each needs no per-write confirmation. Step 6's first-run note is the post-hoc transparency mechanism, not a substitute confirmation.

**Step 1 — Detect vault (REQUIRED):** `Bash(obsidian vault)` → record vault name and path. If `Bash(obsidian vaults)` lists more than one vault, ask "Which vault should I use?" (the only permitted question). Otherwise continue silently.

**Step 2 — Apply defaults (no CLI call needed):** Record all `vault_layout` defaults in memory. Do NOT pre-create folders. Do NOT run reconciliation. Folders are created lazily on first write.

**Step 3 — Create Profile.md via obsidian CLI (REQUIRED):** Profile.md is a vault file — it MUST be created via `obsidian create` so Obsidian indexes it. Do NOT use the `Write` tool for vault files. Content = the canonical [§11.4](#114--profilemd-section-schema-locked) schema with all sections empty, `default_capture_time: unset` under `## Preferences`, and the full default `vault_layout` block (every key from [§A1.3](#a13--vault_layout-schema), including `inbox`, `inbox_file`, `plans`) as the final section:
```
obsidian create name="Profile.md" path="<root>" content="<§11.4 canonical content>"
```
Do NOT use the `silent` flag here — if the create fails (e.g. Eliot folder doesn't exist), the error must surface so you can handle it. If it fails, retry with an explicit folder creation step first: `obsidian create name=".keep" path="<root>" content=""` then retry Profile.md creation. After creating Profile.md, wait 1 second for Obsidian to index it: `Bash(sleep 1)` (all platforms — the Bash tool is POSIX even on Windows). Then verify with `obsidian read path="<root>/Profile.md"` before proceeding.

**Step 4 — Write sentinel (REQUIRED):** Use Claude Code `Write` tool (NOT shell redirection). Detect home: Windows = `$env:USERPROFILE`, macOS/Linux = `$HOME`. Write to `<home>/.eliot/onboarded`:
```
onboarded_at: <ISO-8601>
skill_version: <version from frontmatter>
```

**Step 5 — Execute the user's task:** Now run the task exactly as if both sentinels were present (§Session Open → task flow). Begin the response with: `Hi — I'm Eliot, your Obsidian assistant.`

**Step 6 — Append first-run note (after task output):** exact string lives in `SKILL.md §Silent Setup`.

---

## §3.3 — Last-Write Journal: File Format and Entry Shapes

The journal is a single JSON array persisted at `<home>/.eliot/last-writes.json`. Every entry shape below carries a `vault` key (absolute vault path) so the undo ring can be filtered to the current vault; `ts` is ISO-8601.

**Write procedure:** in the same turn, immediately after a vault write succeeds — `Read` the journal (missing → treat as empty array; unparseable → replace with empty array and note it to the user), append the new entry in memory, trim to the newest 25 entries total, `Write` the full file back. One journal write per user-approved vault op — bulk ops stay one entry per batch, never one per item.

**Voice-rule exemption:** journal bookkeeping writes are part of the approved vault write that triggered them — exempt from §Identity and Voice's "never perform an unrequested write" rule; the journal append needs no separate confirmation. The journal stores vault content snapshots in **plaintext** under the user's home directory, per-machine — it is not synced, so cross-machine undo stays out of scope.

**Ring semantics:** the undo ring is the newest 5 entries whose `vault` matches the current vault, evaluated against the full persisted journal (per-vault N=5 — no longer a per-session count).

**Concurrency note (accepted risk):** concurrent Eliot sessions read-modify-write the same file; a rare clobber can lose another session's newest entry. Mitigated, not prevented, by the ts+file display and the mismatch handling below.

**Mismatch handling:** on mismatch — the recorded line is absent from the file, or the file changed since an `overwrite-profile`/`task-done` snapshot — show a ≤12-line diff of the file's current state versus what undo would apply, warn that the file changed since the write, and proceed only on explicit "yes" plus per-invocation tool approval (two confirmation layers). Bulk batch: "That was a triage of <N> items. Undo all, pick specific ones, or cancel?"

**Entry shapes:** single-write `{ ts, vault, file, op, content }` · bulk-triage (one entry, shown below) · dual-link (one entry, shown below) · tidy-strays (one entry) `{ ts, vault, op:"tidy-strays", batch_size, items:[{from, to, status}, ...] }` — see [§Tidy Strays — Procedure Detail](#tidy-strays--procedure-detail) · doctor (one entry) `{ ts, vault, op:"doctor", batch_size, items:[{check, target, action, status}, ...] }` — see [§Doctor — Check Catalog](#doctor--check-catalog) · task-done `{ ts, vault, file, op:"task-done", content:"<pre-write content>" }` — see [§Lifecycle — Procedure Detail](#lifecycle--procedure-detail) · overwrite-profile `{ ts, vault, op:"overwrite-profile", content:"<full pre-write content>" }` — see [§7a](#7a--profilemd-vault_layout-rewrite-procedure). A bulk inbox triage occupies exactly ONE journal entry:

```
{
  ts: "<ISO-8601>",
  vault: "<absolute-vault-path>",
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

**Dual-link entry shape** (one entry, referenced from `SKILL.md §Dual-Link Detection`):

```
{
  ts: "<ISO-8601>",
  vault: "<absolute-vault-path>",
  op: "dual-link",
  items: [
    { file: "<notes>/<YYYY>/<slug>.md", op: "create" },
    { file: "<projects>/<related_project>.md", op: "append", line: "- [[<note-slug>]] — <one-line summary>" }
  ]
}
```
Undo prompt: "Undo both the note and the project link, just one, or cancel?"

---

## §3.2 — Sentinel Write Procedure

Use Claude Code's `Write` tool with an absolute path. NOT shell redirection (`echo >`, `Set-Content`, `Out-File`).

1. Detect home directory: Windows = value of `$env:USERPROFILE`; macOS/Linux = value of `$HOME`.
2. Construct absolute path: `<home>/.eliot/onboarded` (Windows: `<USERPROFILE>\.eliot\onboarded`).
3. Write tool with that absolute path. Content (two lines terminated by newline):
   ```
   onboarded_at: <ISO-8601-timestamp>
   skill_version: <version from frontmatter>
   ```
4. Claude Code's Write tool creates parent directories (`<home>/.eliot/`) automatically.
5. On subsequent invocations, use the `Read` tool (not Bash) to check existence.

**Dual-Sentinel State Decision Table (part of §3.2):**

Both sentinels MUST be present to skip setup. Partial state is not silent continuation.

| Sentinel (`~/.eliot/onboarded`) | Profile.md (`<root>/Profile.md`) | Action |
|---|---|---|
| Absent | Absent | §Silent Setup (runs silently, then executes task) |
| Present | Present | §Session Open (normal) |
| Absent | Present | Partial state (c): offer sentinel-only recreate or full re-run |
| Present | Absent | Partial state (d): offer Profile.md-only recreate or full re-run |

**Partial-state prompts (exact wording):**
- **(c) Profile.md present, sentinel absent:** "I see your `Eliot/Profile.md` but no per-user setup record. Should I recreate the setup record now (skip re-onboarding) or re-run full setup?" Accept-recreate → write sentinel only (steps above) → §Session Open. Re-run → §Silent Setup.
- **(d) Sentinel present, Profile.md absent:** "My setup record exists but `Eliot/Profile.md` is missing. Should I recreate `Profile.md` from defaults, or re-run full setup?" Accept-recreate → write minimal Profile.md with defaults + sentinel → §Session Open. Re-run → §Silent Setup.

---

## §Templates

### Project Template

Section policy: `## Goal` is **REQUIRED** — if the user didn't state a goal, ask one question ("What does done look like?") before creating; never emit placeholder text into the file. `## Next Action` and `## Tasks` are emitted only with real content — never blank `- ` or `- [ ] ` stubs (empty checkboxes pollute `obsidian tasks todo`). `## Decisions` and `## Notes` are NOT emitted at creation — the dual-link project-side append formats create them lazily on first use. Include the `area` frontmatter key only when the user names an area — never write `area: "[[]]"`. Include `due:` only when a due date was given.

```markdown
---
created: <YYYY-MM-DD>
type: project
status: active
tags: [project, status/active]
---

# <Project Name>

## Goal
<one-line goal — REQUIRED, from the user's answer>

## Next Action
- <only when known>
```

### Plan Template

Section policy: `## Goal` REQUIRED (ask one question if not given). `## Steps` emitted only with real steps — never a blank `- [ ] ` stub. `## Related Project` only when a project link exists (also drop the `project:` frontmatter key otherwise). `## Notes` NOT emitted at creation (created lazily on first append).

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
<one-line goal — REQUIRED>

## Steps
- [ ] <only real steps>

## Related Project
[[<project-slug>]]
```

### Daily Note Stub Template (minimal, created when daily note is missing)

Deliberately minimal — appends land under the H1; §Daily Review extracts `- [ ]` lines position-independently; `/eliot wrap` appends its own section. Never create a daily note as a bare line without this stub.

```markdown
---
date: <YYYY-MM-DD>
type: daily
tags: [daily]
---

# <YYYY-MM-DD>
```

### Meeting Note Template

Used when content begins with "meeting with", "call with", "sync with", "standup", "1:1", or similar.

Section policy: `## Attendees` and `## Notes` are **REQUIRED**. `## Agenda`, `## Decisions`, `## Action Items` are **OPTIONAL** — emit only when the user gave that information; never emit a blank `- [ ] ` action-item stub.

```markdown
---
date: <YYYY-MM-DD>
type: meeting
attendees: []
projects: []
summary: ""
tags: [meeting]
---

# <Meeting Title>

## Attendees
- <name>

## Notes
<what the user said about the meeting>

## Agenda
<OPTIONAL>

## Decisions
<OPTIONAL>

## Action Items
<OPTIONAL — only real items, e.g. "- [ ] send recap">
```

### Note Template

Used when §Dual-Link Detection finds no matching project.

Section policy: `## The Idea` is **REQUIRED** (always emitted, holds the user's content verbatim). `## Why It Matters` and `## Connections` are **OPTIONAL** — emit them only when the user gave reasons or connections; never emit an empty heading or the bare `- Supports: / - Challenges:` skeleton. Frontmatter: `id`, `created`, `type` always; `up` and `says` filled per §Dual-Link step 3.5. Omit valueless keys — never emit empty `tags`/`aliases`/`related` placeholders.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: permanent
up: []
says: ""
---

# <Title>

## The Idea

<content>

## Why It Matters
<OPTIONAL — only when reasons were given>

## Connections
<OPTIONAL — only with real links, e.g. "- Supports: [[note]]">
```

### Note Template (with project link)

Used when §Dual-Link Detection sets `related_project`. Includes `up` pointing to the project and a `## Related Project` section. Same section policy as the Note Template: `## The Idea` and `## Related Project` REQUIRED; `## Why It Matters` / `## Connections` OPTIONAL (omit when empty).

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: permanent
up:
  - "[[<project-slug>]]"
says: ""
---

# <Title>

## The Idea

<content>

## Related Project
[[<project-slug>]]
```

### Decision Note Template

Used when Rule 2.5 fires (content contains decision trigger keywords). Eliot fills sections from the user's message — does NOT ask for missing sections.

Section policy: `## Context`, `## Decision`, `## Why` are **REQUIRED** (always emitted — extract from the user's message; if genuinely absent, the heading stays with no body). `## Where`, `## Trade-offs`, `## Future Considerations` are **OPTIONAL** — emit only when the user's message contains that information; omit the heading otherwise. The angle-bracket lines below are extraction guidance, never written to the file.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: decision
status: accepted
tags: [decision]
up: []
says: ""
---

# <Decision Title>

## Context
<What situation led to this decision?>

## Decision
<What was decided — one clear statement.>

## Why
<The rationale — what made this the right call?>

## Where
<OPTIONAL — which files, components, or areas are affected?>

## Trade-offs
<OPTIONAL — what do we give up or risk with this approach?>

## Future Considerations
<OPTIONAL — what might need revisiting later?>
```

### Decision Note Template (with project link)

Used when §Dual-Link Detection (decision mode) sets `related_project`. Same section policy as the Decision Note Template; `## Related Project` is REQUIRED.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: decision
status: accepted
tags: [decision]
up:
  - "[[<project-slug>]]"
says: ""
---

# <Decision Title>

## Context
<What situation led to this decision?>

## Decision
<What was decided — one clear statement.>

## Why
<The rationale — what made this the right call?>

## Where
<OPTIONAL>

## Trade-offs
<OPTIONAL>

## Future Considerations
<OPTIONAL>

## Related Project
[[<project-slug>]]
```

### Implementation Note Template

Used when Rule 2.6 fires (content contains implementation trigger phrases). Eliot fills sections from the user's message — does NOT ask for missing sections.

Section policy: `## What Was Built` and `## Where` are **REQUIRED**. `## Why`, `## What's Good`, `## Watch Out For`, `## Next Steps` are **OPTIONAL** — emit only when the user's message contains that information; omit the heading otherwise. Angle-bracket lines are extraction guidance, never written to the file.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: implementation
tags: [implementation]
up: []
says: ""
---

# <Implementation Title>

## What Was Built
<The change or feature, in plain terms.>

## Where
<Files, components, or areas affected.>

## Why
<OPTIONAL — the motivation.>

## What's Good
<OPTIONAL — benefits, what works well.>

## Watch Out For
<OPTIONAL — risks, gotchas, edge cases.>

## Next Steps
<OPTIONAL — follow-ups left to do.>
```

### Implementation Note Template (with project link)

Used when §Dual-Link Detection (implementation mode) sets `related_project`. Same section policy as the Implementation Note Template; `## Related Project` is REQUIRED.

```markdown
---
id: <YYYYMMDDHHmm>
created: <YYYY-MM-DD>
type: implementation
tags: [implementation]
up:
  - "[[<project-slug>]]"
says: ""
---

# <Implementation Title>

## What Was Built
<The change or feature, in plain terms.>

## Where
<Files, components, or areas affected.>

## Why
<OPTIONAL>

## What's Good
<OPTIONAL>

## Watch Out For
<OPTIONAL>

## Next Steps
<OPTIONAL>

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

### Eliot/README Template (created on request)

Used when the user asks for a README/conventions file in the Eliot folder (e.g. "add a readme to your folder"). Normal write rules apply — confirm before creating; never written during onboarding.

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

"undo that" or "undo the last capture" works across sessions on this machine via Eliot's write journal (`~/.eliot/last-writes.json`).
Cross-machine, or beyond the last writes: use Obsidian File Recovery, Sync history, or git.

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

- Last-write record persists across sessions in `<home>/.eliot/last-writes.json` (25-entry cap, per-vault N=5 undo ring). `/eliot doctor` journal-health checks and `/eliot status` journal reporting are not yet implemented — future enhancements.
- Multi-vault support is P2. v1 always uses the active vault.
- `obsidian search:context` is not in the verified CLI surface and is not pre-approved.
- `/eliot brief` and `/eliot wrap` are P2 features.
- §Doctor never auto-merges duplicate content beyond the `## Merged from <dupe>` append; deeper merges are the user's call.
- Non-md artifacts inside Eliot folders (scripts, images misfiled by other tools) are report-only — Eliot never moves non-vault files.
- `vault_layout` values may use any Unicode script (CJK included) — the §A1.4 guard is a denylist, not an ASCII allowlist. The residual limit: a value containing a denylisted character (`'` `"` `\` `` ` `` `$` `;`, or a control character) cannot be used in eval-based operations (tidy moves, doctor fixes) — the affected item is marked `failed` — until corrected via [§7a](#7a--profilemd-vault_layout-rewrite-procedure). Reads and writes to the configured path are unaffected.
