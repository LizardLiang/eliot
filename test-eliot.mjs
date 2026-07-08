/**
 * test-eliot.mjs
 * End-to-end tests for the Eliot skill using @anthropic-ai/claude-agent-sdk.
 * Tests reflect pure user flow — no manual setup outside the skill.
 *
 * Usage:
 *   node test-eliot.mjs
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { cpSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// Install skill into .claude/skills/eliot/ so the SDK finds it
const SKILLS_DIR = join(__dir, ".claude", "skills", "eliot");
rmSync(SKILLS_DIR, { recursive: true, force: true });
mkdirSync(join(SKILLS_DIR, "examples"), { recursive: true });
cpSync(join(__dir, "SKILL.md"), join(SKILLS_DIR, "SKILL.md"));
cpSync(join(__dir, "reference.md"), join(SKILLS_DIR, "reference.md"));
cpSync(join(__dir, "examples", "dialogues.md"), join(SKILLS_DIR, "examples", "dialogues.md"));
console.log(`Skill installed → ${SKILLS_DIR}\n`);

const OPTS = {
  cwd: __dir,
  model: "claude-sonnet-5",
  skills: ["eliot"],
  allowedTools: ["Bash(obsidian *)", "Write", "Read", "Glob"],
  permissionMode: "bypassPermissions",
  maxTurns: 15,
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
          process.stdout.write(`\n[tool: ${block.name} ${JSON.stringify(block.input).slice(0, 100)}]\n`);
        }
      }
    }
    if (msg.type === "result" && typeof msg.result === "string") {
      output += msg.result;
    }
  }
  return output.trim();
}

// ---------------------------------------------------------------------------
// Evals — pure user flow, no pre-setup
// ---------------------------------------------------------------------------
const EVALS = [
  {
    id: 1,
    name: "first-ever invocation → silent setup + simple capture",
    // Both sentinels absent. User just types a capture.
    // Skill must: detect first-run, set up silently, capture, then mention setup at end.
    prompt: "capture: buy groceries",
    assertions: {
      "Eliot self-names": (o) => o.includes("Eliot"),
      "Captured without blocking wizard": (o) => !/okay to start\?|quick setup|two minutes/i.test(o),
      "Routes to task or inbox (Rule 2 / fallback)": (o) => /task|today|inbox|daily/i.test(o),
      "First-run note at end": (o) => /first run|set up with defaults|\/eliot status/i.test(o),
    },
  },
  {
    id: 2,
    name: "second invocation → daily review (no wizard re-trigger)",
    // Sentinels now present from eval 1. Skill must go straight to daily review.
    prompt: "eliot, what's on my plate today?",
    assertions: {
      "No exclamation marks (voice rule)": (o) => !o.includes("!"),
      "No onboarding wizard re-triggered": (o) => !/okay to start\?|quick setup/i.test(o),
      "References today / tasks / schedule": (o) => /today|tasks|schedule|plate/i.test(o),
    },
  },
  {
    id: 3,
    name: "note capture (Rule 4 — I think + declarative)",
    prompt: "capture: I think the reason our standups always run over is because we don't timebox individual updates — people drift into problem-solving mode instead of just stating status",
    assertions: {
      "Classified as note (not task/inbox)": (o) => /note|Notes\//i.test(o),
      "Targets Eliot/Notes/ (root-prefixed)": (o) => o.includes("Eliot/Notes/"),
      "Slug derived from content": (o) => /standup|timebox/i.test(o),
      "No unnecessary clarifying question": (o) => (o.match(/\?/g) ?? []).length <= 1,
    },
  },
];

async function main() {
  console.log("=== Eliot Skill — End-to-End Test Suite ===\n");

  const results = [];

  for (const ev of EVALS) {
    console.log(`${"─".repeat(60)}`);
    console.log(`Eval ${ev.id}: ${ev.name}`);
    console.log(`Prompt: "${ev.prompt.slice(0, 80)}${ev.prompt.length > 80 ? "..." : ""}"`);
    console.log("─".repeat(60) + "\n");

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

  console.log("═".repeat(60));
  console.log("SUMMARY");
  console.log("═".repeat(60));
  let allPassed = 0, allTotal = 0;
  for (const r of results) {
    const icon = r.passed === r.total ? "✓" : r.passed > 0 ? "~" : "✗";
    console.log(`  ${icon}  Eval ${r.id} (${r.name}): ${r.passed}/${r.total}`);
    allPassed += r.passed;
    allTotal += r.total;
  }
  console.log(`\nOverall: ${allPassed}/${allTotal}`);
}

let exitCode = 0;
try {
  await main();
} catch (err) {
  console.error("Fatal:", err);
  exitCode = 1;
} finally {
  rmSync(SKILLS_DIR, { recursive: true, force: true });
}
process.exit(exitCode);
