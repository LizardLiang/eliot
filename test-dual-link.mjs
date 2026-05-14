/**
 * test-dual-link.mjs
 * End-to-end tests for §Dual-Link Detection — bidirectional note ↔ project linking.
 *
 * Evals run sequentially (vault state carries forward):
 *   1. Create the Jarvis project (prerequisite for dual-link evals)
 *   2. Capture a ≥20-word note mentioning Jarvis → verify dual-link fires
 *   3. Capture a ≥20-word note with no project reference → verify NO dual-link
 *   4. Schedule item + project (Rule 5 tie-breaker) → verify schedule only, no dual-link
 *
 * Usage:
 *   node test-dual-link.mjs
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { cpSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SKILL_SRC = join(process.env.USERPROFILE, ".claude", "skills", "eliot");

const SKILLS_DIR = join(__dir, ".claude", "skills", "eliot");
rmSync(SKILLS_DIR, { recursive: true, force: true });
mkdirSync(join(SKILLS_DIR, "examples"), { recursive: true });
cpSync(join(SKILL_SRC, "SKILL.md"), join(SKILLS_DIR, "SKILL.md"));
cpSync(join(SKILL_SRC, "reference.md"), join(SKILLS_DIR, "reference.md"));
cpSync(join(SKILL_SRC, "examples", "dialogues.md"), join(SKILLS_DIR, "examples", "dialogues.md"));
console.log(`Skill installed → ${SKILLS_DIR}\n`);

const OPTS = {
  cwd: __dir,
  skills: ["eliot"],
  allowedTools: ["Bash(obsidian *)", "Write", "Read", "Glob"],
  permissionMode: "bypassPermissions",
  maxTurns: 20,
};

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

const EVALS = [
  {
    id: 1,
    name: "prerequisite — create Jarvis project",
    prompt: "eliot, start project: Jarvis",
    assertions: {
      "Project file created in Projects/": (o) => /Projects\/jarvis/i.test(o),
      "Confirms project name": (o) => /jarvis/i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
  },
  {
    id: 2,
    name: "dual-link happy path — note mentioning existing project",
    prompt:
      "eliot, capture: The Jarvis auth module handles JWT login, token refresh, and session expiry. It uses bcrypt for password hashing and stores refresh tokens in Redis with a 7-day TTL.",
    assertions: {
      "Creates note in Notes/ folder": (o) => /Notes\//i.test(o),
      "Confirmation references Jarvis project": (o) => /jarvis/i.test(o),
      "Confirmation covers both files (note + project)": (o) =>
        /Notes\//i.test(o) && /jarvis|Projects\//i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
  },
  {
    id: 3,
    name: "no project match — standard note, no dual-link",
    prompt:
      "eliot, capture: I think the new rate-limiting approach using a sliding window algorithm is more accurate than the fixed counter because it smooths out burst traffic at window boundaries.",
    assertions: {
      "Creates note in Notes/ folder": (o) => /Notes\//i.test(o),
      "Does NOT mention linking to a project": (o) => !/linked to|Projects\//i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
  },
  {
    id: 4,
    name: "regression — Rule 5 schedule+project still single write (no dual-link)",
    prompt: "eliot, capture: deploy Jarvis to production tomorrow at 3pm",
    assertions: {
      "Routes to schedule / daily note (Rule 5 wins)": (o) =>
        /schedule|daily|Schedules\//i.test(o),
      "Wikilink [[jarvis]] in schedule line": (o) => /\[\[jarvis\]\]/i.test(o),
      "Does NOT mention linking note to project": (o) =>
        !/linked to.*jarvis|captured note.*and linked/i.test(o),
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
    },
  },
];

async function main() {
  console.log("=== Eliot Dual-Link — End-to-End Test Suite ===\n");

  const results = [];

  for (const ev of EVALS) {
    console.log("─".repeat(64));
    console.log(`Eval ${ev.id}: ${ev.name}`);
    console.log(`Prompt: "${ev.prompt.slice(0, 90)}${ev.prompt.length > 90 ? "..." : ""}"`);
    console.log("─".repeat(64) + "\n");

    let output = "";
    try {
      output = await runQuery(ev.prompt);
    } catch (err) {
      output = `ERROR: ${err.message}`;
      console.error(output);
    }

    console.log("\n\nAssertions:");
    let passed = 0;
    for (const [label, fn] of Object.entries(ev.assertions)) {
      const ok = fn(output);
      if (ok) passed++;
      console.log(`  ${ok ? "✓" : "✗"} ${label}`);
    }
    const total = Object.keys(ev.assertions).length;
    console.log(`\nScore: ${passed}/${total}\n`);
    results.push({ id: ev.id, name: ev.name, passed, total });
  }

  console.log("═".repeat(64));
  console.log("SUMMARY");
  console.log("═".repeat(64));
  let allPassed = 0,
    allTotal = 0;
  for (const r of results) {
    const icon = r.passed === r.total ? "✓" : r.passed > 0 ? "~" : "✗";
    console.log(`  ${icon}  Eval ${r.id} (${r.name}): ${r.passed}/${r.total}`);
    allPassed += r.passed;
    allTotal += r.total;
  }
  console.log(`\nOverall: ${allPassed}/${allTotal}`);

  if (allPassed < allTotal) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
