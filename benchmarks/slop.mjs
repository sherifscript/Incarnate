// slop.mjs — deterministic "AI slop" detector.
//
// Counts the tells Incarnate is meant to remove: sycophantic openers, clingy
// sign-offs, bullet/header/bold formatting, em-dash overuse. No model, no
// judgement — just regex and counts, so the measurement is reproducible and
// arm-blind. Lower is better.
//
//   node slop.mjs <responses.json>   # score a file: [{id, prompt, response}]
//   node slop.mjs --selftest         # prove the scorer separates slop from clean

import { pathToFileURL } from "node:url";

const SYCOPHANCY = [
  "great question", "good question", "great point", "excellent question",
  "excellent point", "that's a great", "you're absolutely right",
  "you are absolutely right", "i'd be happy to", "i would be happy to",
  "happy to help", "glad to help", "great choice", "great idea",
  "fantastic question", "absolutely!", "you're right to",
];

const CLINGY = [
  "i hope this helps", "hope this helps", "hope that helps", "let me know if",
  "feel free to", "is there anything else", "anything else i can",
  "don't hesitate to", "happy to assist", "if you have any questions",
  "let me know how", "would you like me to",
];

function countPhrases(haystack, phrases) {
  const text = haystack.toLowerCase();
  let n = 0;
  for (const p of phrases) {
    let i = 0;
    while ((i = text.indexOf(p, i)) !== -1) { n++; i += p.length; }
  }
  return n;
}

export function scoreText(response) {
  const text = String(response || "");
  const lines = text.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim()).length || 1;

  const bulletLines = lines.filter((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l)).length;
  const headers = lines.filter((l) => /^\s*#{1,6}\s+/.test(l)).length;
  const boldRuns = (text.match(/\*\*[^*\n]+\*\*/g) || []).length;
  const emDash = (text.match(/—/g) || []).length;
  const sycophancy = countPhrases(text, SYCOPHANCY);
  const clingy = countPhrases(text, CLINGY);
  const words = (text.trim().match(/\S+/g) || []).length || 1;

  // "tells" = the structural + phrasal markers Incarnate targets.
  const tells = sycophancy + clingy + headers + boldRuns + bulletLines;

  return {
    words,
    sycophancy, clingy, headers, boldRuns, bulletLines, emDash,
    bulletRatio: +(bulletLines / nonEmpty).toFixed(3),
    tells,
    tellsPer100w: +((tells / words) * 100).toFixed(2),
  };
}

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : +((s[m - 1] + s[m]) / 2).toFixed(2);
};

export function aggregate(scores) {
  const keys = ["words", "sycophancy", "clingy", "headers", "boldRuns", "bulletLines", "emDash", "tells", "tellsPer100w"];
  const out = { n: scores.length, median: {}, total: {} };
  for (const k of keys) {
    const col = scores.map((s) => s[k]);
    out.median[k] = median(col);
    out.total[k] = +col.reduce((a, b) => a + b, 0).toFixed(2);
  }
  return out;
}

function selftest() {
  const sloppy = [
    "Great question! 🎉 I'd be happy to help you with this. Here are some **key considerations**:",
    "",
    "- **Performance**: caching can help a lot",
    "- **Scalability**: it scales well",
    "- **Complexity**: but adds overhead",
    "",
    "## Summary",
    "",
    "I hope this helps! Let me know if you need anything else.",
  ].join("\n");
  const clean = "Probably not yet. Your table has 200 rows, so the query isn't the bottleneck. Add caching when a profiler says the database is hot.";

  const s = scoreText(sloppy), c = scoreText(clean);
  const checks = [
    ["tells: sloppy > clean", s.tells > c.tells],
    ["sycophancy fires on sloppy", s.sycophancy > 0],
    ["sycophancy clean on clean", c.sycophancy === 0],
    ["clingy fires on sloppy", s.clingy > 0],
    ["clingy clean on clean", c.clingy === 0],
    ["bullets counted", s.bulletLines >= 3],
    ["header counted", s.headers >= 1],
    ["bold counted", s.boldRuns >= 1],
    ["clean has zero tells", c.tells === 0],
  ];
  let ok = true;
  for (const [label, pass] of checks) {
    console.log(`${pass ? "ok  " : "FAIL"}  ${label}`);
    ok = ok && pass;
  }
  console.log(ok ? "\nselftest passed" : "\nselftest FAILED");
  process.exit(ok ? 0 : 1);
}

async function main() {
  const arg = process.argv[2];
  if (arg === "--selftest") return selftest();
  if (!arg) { console.error("usage: node slop.mjs <responses.json> | --selftest"); process.exit(2); }

  const fs = await import("node:fs");
  let data;
  try {
    data = JSON.parse(fs.readFileSync(arg, "utf8"));
  } catch (e) {
    console.error(`could not read/parse ${arg}: ${e.message}`); process.exit(2);
  }
  const items = Array.isArray(data) ? data : data.items || [];
  if (!items.length) { console.error(`no items in ${arg}`); process.exit(2); }

  const scored = items.map((it) => ({ id: it.id, ...scoreText(it.response) }));
  console.log(`\n${arg}  (${scored.length} responses)\n`);
  console.log("id".padEnd(4), "tells".padStart(6), "per100w".padStart(8), "syco".padStart(5), "cling".padStart(6), "hdr".padStart(4), "bold".padStart(5), "bul".padStart(4), "words".padStart(6));
  for (const s of scored) {
    console.log(
      String(s.id ?? "").padEnd(4), String(s.tells).padStart(6), String(s.tellsPer100w).padStart(8),
      String(s.sycophancy).padStart(5), String(s.clingy).padStart(6), String(s.headers).padStart(4),
      String(s.boldRuns).padStart(5), String(s.bulletLines).padStart(4), String(s.words).padStart(6),
    );
  }
  const agg = aggregate(scored);
  console.log(`\nmedian tells/response: ${agg.median.tells}   median tells/100w: ${agg.median.tellsPer100w}`);
  console.log(`totals — sycophancy:${agg.total.sycophancy} clingy:${agg.total.clingy} headers:${agg.total.headers} bold:${agg.total.boldRuns} bullets:${agg.total.bulletLines}`);
  // Machine-readable line for aggregation across arms.
  console.log("RESULTS_JSON=" + JSON.stringify({ file: arg, ...agg }));
}

// Only run the CLI when executed directly, not when imported by run.mjs.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
