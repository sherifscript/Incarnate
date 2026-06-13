// run.mjs — controlled API benchmark: same model, two system-prompt arms.
//
// The only difference between arms is whether Incarnate's spec is the system
// prompt. That isolates the plugin's causal effect on output style. Scored by
// the same deterministic slop.mjs used everywhere else.
//
//   ANTHROPIC_API_KEY=... node run.mjs [model] [promptsFile]
//   model defaults to claude-opus-4-8. Try claude-sonnet-4-6, claude-haiku-4-5.
//   promptsFile defaults to prompts.json. Pass stress.json for the hard set.
//
// Writes results/api-<model>-<label><arm>.json, where <label> is "" for
// prompts.json and "<basename>-" otherwise, so the stress arms don't clobber
// the default ones. Needs: npm install   (pulls @anthropic-ai/sdk)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { scoreText, aggregate } from "./slop.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const model = process.argv[2] || "claude-opus-4-8";
const promptsFile = process.argv[3] || "prompts.json";
const label = promptsFile === "prompts.json" ? "" : path.basename(promptsFile, ".json") + "-";

const prompts = JSON.parse(fs.readFileSync(path.join(here, promptsFile), "utf8"));
const skill = fs.readFileSync(path.join(here, "..", "skills", "incarnate", "SKILL.md"), "utf8")
  .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ""); // strip frontmatter → the voice spec

const client = new Anthropic();

async function answer(prompt, system) {
  const req = { model, max_tokens: 1024, messages: [{ role: "user", content: prompt }] };
  if (system) req.system = system;
  const res = await client.messages.create(req);
  return res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

async function runArm(name, system) {
  const items = [];
  for (const p of prompts) {
    process.stderr.write(`[${model}] ${label}${name} #${p.id}\n`);
    items.push({ id: p.id, prompt: p.prompt, response: await answer(p.prompt, system) });
  }
  const dir = path.join(here, "results");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `api-${model}-${label}${name}.json`);
  fs.writeFileSync(file, JSON.stringify(items, null, 2));
  return { name, agg: aggregate(items.map((it) => scoreText(it.response))) };
}

const baseline = await runArm("baseline", null);
const incarnate = await runArm("incarnate", skill);

const pct = (a, b) => (a === 0 ? 0 : Math.round(((a - b) / a) * 100));
console.log(`\nmodel: ${model}   set: ${label || "prompts-"}`);
console.log("metric           baseline   incarnate   reduction");
for (const k of ["tells", "tellsPer100w", "sycophancy", "clingy", "headers", "boldRuns", "bulletLines"]) {
  const b = baseline.agg[k === "tells" || k === "tellsPer100w" ? "median" : "total"][k];
  const i = incarnate.agg[k === "tells" || k === "tellsPer100w" ? "median" : "total"][k];
  console.log(k.padEnd(16), String(b).padStart(8), String(i).padStart(11), `${pct(b, i)}%`.padStart(11));
}
console.log("\nRESULTS_JSON=" + JSON.stringify({ model, baseline: baseline.agg, incarnate: incarnate.agg }));
