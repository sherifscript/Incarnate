# Benchmarks

Does the Incarnate voice layer actually reduce slop? This measures it.

## What "slop" means here

[`slop.mjs`](slop.mjs) is a deterministic scorer — no model, no judgement, just regex and counts of the exact tells Incarnate targets: sycophantic openers ("great question", "you're absolutely right", "I'd be happy to"), clingy sign-offs ("I hope this helps", "let me know if", "feel free to"), and slop formatting (bullet lines, `##` headers, `**bold**` runs, em-dashes). One headline number, `tells`, is the sum of those markers per response; `tellsPer100w` normalizes for length. Lower is better.

Because the scorer is mechanical, it's arm-blind: it scores baseline and Incarnate output the same way, so the comparison can't be fudged. Verify it separates obvious slop from clean prose:

```
node slop.mjs --selftest
```

## The experiment

Two arms, same prompts ([`prompts.json`](prompts.json)), same model. The **only** difference is whether Incarnate's spec governs the reply:

- **baseline** — the model answers with no Incarnate context.
- **incarnate** — the model answers under the spec from [`../skills/incarnate/SKILL.md`](../skills/incarnate/SKILL.md) (frontmatter stripped — exactly what the SessionStart hook injects).

Holding the model and prompts fixed isolates the plugin's causal effect on style. Results land in [`results/`](results/), scored by `slop.mjs`.

## Two ways to run it

**Agent-run (no API key).** A subagent *is* the model under a system prompt, so a baseline agent and an Incarnate agent answering the same prompts is the same experiment, executed through the Agent tool. This is how the committed `results/baseline.json` and `results/incarnate.json` were produced (single model: whatever ran the agents). Re-score them any time:

```
node slop.mjs results/baseline.json
node slop.mjs results/incarnate.json
```

**API-run (controlled, multi-model).** For the same experiment as a clean API measurement across models, set a key and run the harness. It calls each model twice per prompt (baseline vs Incarnate system prompt) and prints the reduction per metric:

```
npm install
ANTHROPIC_API_KEY=... node run.mjs claude-opus-4-8
ANTHROPIC_API_KEY=... node run.mjs claude-sonnet-4-6
ANTHROPIC_API_KEY=... node run.mjs claude-haiku-4-5
```

~10 prompts × 2 arms × 1024 max tokens per model — a few cents each.

`run.mjs` takes an optional second argument, a prompts file (default `prompts.json`); pass `stress.json` to generate the harder arms for the judge below. Stress arms are written as `api-<model>-stress-<arm>.json` so they don't clobber the defaults.

## Substance, not just slop

`slop.mjs` scores form. It can't see whether a reply is honest, pushes back, or avoids making things up — the traits the voice is really for. [`judge.mjs`](judge.mjs) measures those. It runs both arms over a harder set, [`stress.json`](stress.json) — eight prompts engineered to bait sycophancy, confabulation, over-formatting, capitulation under pressure, and rewriting the user's voice on an edit — then hands each pair of replies to a judge model, anonymized as A and B, and asks which better satisfies each rubric criterion: honesty, willingness to disagree, formatting that fits the content, brevity, a human voice, not confabulating, and preserving the user's wording. The judge is never told the arms exist. Every pair is judged in both orders and averaged, so a judge that just favors whichever reply it sees first nets out to ~50%.

```
ANTHROPIC_API_KEY=... node run.mjs   claude-opus-4-8 stress.json   # generate the stress arms
ANTHROPIC_API_KEY=... node judge.mjs claude-opus-4-8 stress.json   # judge them (judge model defaults to sonnet)
```

A criterion's score is the share of judgements that preferred the Incarnate arm: 50% is a coin flip, higher favors Incarnate. Per-model results land in `results/judge-<model>-stress-.json`.

Read these as directional, not definitive. Eight prompts means each criterion rests on a handful of judgements; the judge is a model, not a human panel; and judging an arm with the same model that generated it carries a self-preference risk (the committed Sonnet run does exactly that). The honest payoff is that the rubric shows where Incarnate ties or loses — willingness-to-disagree lands near a coin flip because default Claude already pushes back, and on a pure typo-fix the spec's habit of explaining its judgment calls actually costs it against a baseline that just makes the edit.

## Honest caveats

The agent-run arms are genuine generations scored objectively, but they're single-model and the baseline reflects that model's natural chat style, not a worst-case slop machine — so the delta is a floor, not a ceiling. The API harness is the controlled version; run it for numbers you'd quote.
