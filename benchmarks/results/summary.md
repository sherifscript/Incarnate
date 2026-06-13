# Results

Controlled run: the same ten prompts ([`../prompts.json`](../prompts.json)), the same model, twice — the only thing that changes is whether Incarnate's spec is the system prompt. The baseline is a bare API call with no system prompt at all. Scored by [`../slop.mjs`](../slop.mjs); "tells" is the sum across all ten replies of sycophantic openers, clingy sign-offs, markdown headers, bold runs, and bullet lines.

| model | tells (baseline → Incarnate) | median tells/reply | words |
|---|---|---|---|
| Claude Opus 4.8 | 154 → 13 (−92%) | 13.5 → 0 | 2,666 → 2,296 |
| Claude Sonnet 4.6 | 218 → 3 (−99%) | 23 → 0 | 2,521 → 1,621 |
| Claude Haiku 4.5 | 214 → 8 (−96%) | 22 → 0 | 2,066 → 2,019 |

Per-model arms are in `api-<model>-baseline.json` and `api-<model>-incarnate.json`. Reproduce any row with `ANTHROPIC_API_KEY=... node run.mjs <model>` (see [../README.md](../README.md)).

## The default really is that sloppy

The baselines score high because a bare API call carries no anti-slop instruction of any kind — it reaches for a header, a bulleted list, and bolded lead-ins on nearly every answer. That is the default people get when nothing intervenes. The spec removes nearly all of it and writes shorter while doing it. What survives under Incarnate isn't sycophancy or headers — it's a few bullets and bold runs the model used where the content genuinely was a list (Opus kept 5 bullets and 8 bolds, Haiku 8 bolds, Sonnet 3 bolds), which the deterministic detector can't tell apart from slop. That ceiling is the reason for the second eval below.

## Substance, not just formatting

The slop score measures form. The substance run ([`../judge.mjs`](../judge.mjs) over [`../stress.json`](../stress.json)) measures whether the voice is actually honest, pushes back, and doesn't confabulate — a blind judge model picks between the two arms on eight adversarial prompts, every pair scored in both orders. Per-model results are in `judge-<model>-stress-.json`. Aggregated across the three models, the Incarnate arm was preferred for reading human (93%), not confabulating (88%), and leading with the honest objection (85%); it was near a coin flip on willingness to disagree (58%, since default Claude already pushes back some) and lost on preserving wording during a pure edit (33%, where it adds a note about its judgment calls instead of silently making the fix). Directional, not definitive — eight prompts, a model judge rather than a human panel, and the Sonnet arm judged by Sonnet.

## Agent-run cross-check

[`baseline.json`](baseline.json) and [`incarnate.json`](incarnate.json) are a single-model run done through subagents instead of the API: a baseline agent and an Incarnate agent answering the same ten prompts in their natural style. The agent baseline scored 64 tells — well below the API baseline's 150–220, because a Claude Code agent answers more plainly than a bare API call — and Incarnate still took it to zero. Same experiment, a cleaner starting point: a floor next to the API baseline's ceiling.
