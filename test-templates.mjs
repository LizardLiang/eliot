/**
 * test-templates.mjs
 * End-to-end tests for the Obsidian best practices added to Eliot:
 *   - Meeting notes (Rule 0.5): type:meeting frontmatter, attendees, projects
 *   - Meeting + time anchor: dual write (note + schedule-item)
 *   - Meeting + project: bidirectional link (meeting ↔ project)
 *   - Permanent note: `says` auto-fill, `up` MOC prompt
 *   - Project template: tags include `status/active` for #status/active search
 *
 * Run from Jarvis project root (where @anthropic-ai/claude-agent-sdk is installed):
 *   node test-templates.mjs
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { cpSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const SKILL_SRC = __dir;

// ── install skill ──────────────────────────────────────────────────────────────
const SKILLS_DIR = join(__dir, ".claude", "skills", "eliot");
rmSync(SKILLS_DIR, { recursive: true, force: true });
mkdirSync(join(SKILLS_DIR, "examples"), { recursive: true });
cpSync(join(SKILL_SRC, "SKILL.md"),               join(SKILLS_DIR, "SKILL.md"));
cpSync(join(SKILL_SRC, "reference.md"),           join(SKILLS_DIR, "reference.md"));
cpSync(join(SKILL_SRC, "examples", "dialogues.md"), join(SKILLS_DIR, "examples", "dialogues.md"));
console.log(`Skill installed → ${SKILLS_DIR}\n`);

const OPTS = {
  cwd: __dir,
  skills: ["eliot"],
  allowedTools: ["Bash(obsidian *)", "Write", "Read", "Glob"],
  permissionMode: "bypassPermissions",
  maxTurns: 20,
};

// ── vault helpers ──────────────────────────────────────────────────────────────
function vaultSearch(searchQuery, path = "") {
  try {
    const args = path ? `query="${searchQuery}" path="${path}"` : `query="${searchQuery}"`;
    return execSync(`obsidian search ${args} limit=5`, { encoding: "utf8" });
  } catch { return ""; }
}

function vaultRead(path) {
  try {
    return execSync(`obsidian read path="${path}"`, { encoding: "utf8" });
  } catch { return ""; }
}

/** Extract the first backtick path Eliot confirms — e.g. `Eliot/Notes/2026/slug.md` */
function extractPath(output) {
  const m = output.match(/`(Eliot\/[^`]+\.md)`/);
  return m ? m[1] : null;
}

/** Parse YAML frontmatter from vault file content into a key→value map */
function parseFrontmatter(content) {
  const block = content.match(/^---\n([\s\S]*?)\n---/);
  if (!block) return {};
  const fm = {};
  for (const line of block[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

// ── query runner ───────────────────────────────────────────────────────────────
async function runQuery(prompt) {
  let output = "";
  for await (const msg of query({ prompt, options: OPTS })) {
    if (msg.type === "assistant") {
      for (const block of msg.message?.content ?? []) {
        if (block.type === "text") {
          process.stdout.write(block.text);
          output += block.text;
        }
        if (block.type === "tool_use") {
          process.stdout.write(
            `\n[tool: ${block.name} ${JSON.stringify(block.input).slice(0, 120)}]\n`
          );
        }
      }
    }
    if (msg.type === "result" && typeof msg.result === "string") {
      output += msg.result;
    }
  }
  return output.trim();
}

// ── evals ──────────────────────────────────────────────────────────────────────

const EVALS = [

  // ─── 1. Meeting capture (Rule 0.5) ──────────────────────────────────────────
  {
    id: 1,
    name: "meeting capture → Rule 0.5 (not task, not schedule-item)",
    prompt: "eliot, capture: 1:1 with Alice",
    assertions: {
      "Classified as meeting, not task": (o) =>
        /meeting/i.test(o) && !/task/i.test(o.replace(/meeting/gi, "")),
      "File goes to Notes/ folder": (o) => /Notes\//i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
    vaultAssertions: (o) => {
      const path = extractPath(o);
      if (!path) return { "Vault: file path found in confirmation": false };
      const content = vaultRead(path);
      const fm = parseFrontmatter(content);
      return {
        "Vault: type is 'meeting'": fm.type === "meeting",
        "Vault: attendees field present": "attendees" in fm,
        "Vault: date field present": "date" in fm,
      };
    },
  },

  // ─── 2. Meeting + time anchor → dual write ───────────────────────────────────
  {
    id: 2,
    name: "meeting + time anchor → meeting note AND schedule-item",
    prompt: "eliot, capture: sync with Bob tomorrow at 2pm",
    assertions: {
      "Meeting note created in Notes/": (o) => /Notes\//i.test(o),
      "Schedule-item also written": (o) =>
        /schedule|Schedules\/Daily|daily note|14:00|2pm/i.test(o),
      "Bob mentioned (attendee extracted)": (o) => /bob/i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
    vaultAssertions: (o) => {
      const path = extractPath(o);
      if (!path) return { "Vault: file path found in confirmation": false };
      const content = vaultRead(path);
      const fm = parseFrontmatter(content);
      return {
        "Vault: type is 'meeting'": fm.type === "meeting",
        "Vault: up field present": "up" in fm,
      };
    },
  },

  // ─── 3. Project creation → #status/active searchable ────────────────────────
  {
    id: 3,
    name: "project creation → #status/active tag in frontmatter",
    prompt: "eliot, start project: Template Best Practice Test",
    assertions: {
      "Project created in Projects/": (o) => /Projects\//i.test(o),
      "Project name confirmed": (o) => /template.best.practice.test/i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
    vaultAssertions: (o) => {
      const path = extractPath(o);
      if (!path) return { "Vault: file path found in confirmation": false };
      const content = vaultRead(path);
      const fm = parseFrontmatter(content);
      // Verify search works with no-# form (matches YAML tags array + legacy body text)
      const searchResult = vaultSearch("status/active", "Eliot/Projects");
      return {
        "Vault: type is 'project'": fm.type === "project",
        "Vault: status is 'active'": fm.status === "active",
        "Vault: tags line includes status/active": /status\/active/.test(content),
        "Vault: status/active search finds the project": /template.best.practice.test/i.test(searchResult),
      };
    },
  },

  // ─── 4. Meeting + project → bidirectional link ───────────────────────────────
  {
    id: 4,
    name: "meeting + project → meeting.projects ↔ project.Notes backlink",
    // Uses the project created in eval 3
    prompt:
      "eliot, capture: call with Alice about Template Best Practice Test — reviewed the frontmatter schema and agreed on using the up field for MOC backlinks",
    assertions: {
      "Meeting note created in Notes/": (o) => /Notes\//i.test(o),
      "Linked to Template Best Practice Test project": (o) =>
        /template.best.practice.test/i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
    vaultAssertions: (o) => {
      const path = extractPath(o);
      if (!path) return { "Vault: file path found in confirmation": false };
      const noteContent = vaultRead(path);
      const fm = parseFrontmatter(noteContent);
      // Also check project got the backlink
      const projectContent = vaultRead("Eliot/Projects/template-best-practice-test.md");
      return {
        "Vault: note type is 'meeting'": fm.type === "meeting",
        "Vault: note projects field references the project": /template.best.practice.test/i.test(
          noteContent
        ),
        "Vault: project Notes section has backlink to meeting": /template.best.practice.test/i.test(
          projectContent
        ) && /Notes/i.test(projectContent),
      };
    },
  },

  // ─── 5. Permanent note → `says` auto-fill + `up` prompt ────────────────────
  {
    id: 5,
    name: "permanent note → says auto-filled, up prompt asked",
    prompt:
      "eliot, capture: I think async standups using short Loom recordings are more effective than live standups because people can record at their own pace and viewers can watch at 1.5x speed, which halves the total time cost",
    assertions: {
      "Classified as note (Rule 4)": (o) => /Notes\//i.test(o),
      "Asks about MOC / topic area (up field)": (o) =>
        /topic area|MOC|belong|up field/i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
    vaultAssertions: (o) => {
      const path = extractPath(o);
      if (!path) return { "Vault: file path found in confirmation": false };
      const content = vaultRead(path);
      const fm = parseFrontmatter(content);
      return {
        "Vault: type is 'permanent'": fm.type === "permanent",
        "Vault: id field set (YYYYMMDDHHmm)": /^\d{12}$/.test(fm.id ?? ""),
        "Vault: says field is non-empty": (fm.says ?? "").length > 5,
        "Vault: created field set": "created" in fm,
      };
    },
  },
];

// ── runner ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Eliot — Template Best Practices Test Suite ===\n");

  const results = [];

  for (const ev of EVALS) {
    const divider = "─".repeat(64);
    console.log(divider);
    console.log(`Eval ${ev.id}: ${ev.name}`);
    console.log(`Prompt: "${ev.prompt.slice(0, 90)}${ev.prompt.length > 90 ? "…" : ""}"`);
    console.log(divider + "\n");

    let output = "";
    try {
      output = await runQuery(ev.prompt);
    } catch (err) {
      output = `ERROR: ${err.message}`;
      console.error(output);
    }

    console.log("\n\n── Text assertions:");
    let passed = 0, total = 0;
    for (const [label, fn] of Object.entries(ev.assertions)) {
      const ok = fn(output);
      total++;
      if (ok) passed++;
      console.log(`  ${ok ? "✓" : "✗"} ${label}`);
    }

    if (ev.vaultAssertions) {
      console.log("── Vault assertions (reads actual file):");
      const vResults = ev.vaultAssertions(output);
      for (const [label, ok] of Object.entries(vResults)) {
        total++;
        if (ok) passed++;
        console.log(`  ${ok ? "✓" : "✗"} ${label}`);
      }
    }

    console.log(`\nScore: ${passed}/${total}\n`);
    results.push({ id: ev.id, name: ev.name, passed, total });
  }

  // ── summary ──────────────────────────────────────────────────────────────────
  const WIDE = "═".repeat(64);
  console.log(WIDE);
  console.log("SUMMARY");
  console.log(WIDE);
  let allPassed = 0, allTotal = 0;
  for (const r of results) {
    const icon = r.passed === r.total ? "✓" : r.passed > 0 ? "~" : "✗";
    console.log(`  ${icon}  Eval ${r.id} (${r.name}): ${r.passed}/${r.total}`);
    allPassed += r.passed;
    allTotal += r.total;
  }
  console.log(`\nOverall: ${allPassed}/${allTotal}`);

  return allPassed < allTotal ? 1 : 0;
}

let exitCode = 0;
try {
  exitCode = await main();
} catch (err) {
  console.error("Fatal:", err);
  exitCode = 1;
} finally {
  rmSync(SKILLS_DIR, { recursive: true, force: true });
}
process.exit(exitCode);
