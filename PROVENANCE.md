# Provenance

Incarnate is distilled from the Claude Fable 5 system prompt, kept here in full as [`fable-system-prompt.md`](fable-system-prompt.md). That prompt is 1583 lines, and most of it has no business in a Claude Code plugin. Harnessing it faithfully meant reading it section by section and deciding, for each, whether it was *voice* — the thing people loved and lost — or something else wearing the same file.

Two buckets got left out on purpose. The first is Anthropic's own policy layer: the refusal rules, the harmful-content boundaries, the wellbeing and crisis-handling guidance. That isn't the Fable voice, it's Anthropic governing its own model — and Incarnate isn't Anthropic. Claude Code already ships its own safety layer; bolting a third-party copy on top would be redundant at best and stale the day Anthropic changes theirs. The second bucket is the consumer claude.ai plumbing: artifact storage, the widget tools, the MCP app-suggestion flow, the `/mnt` filesystem, the whole Tool Definitions block. None of those tools exist at the command line, so injecting instructions about them would be noise the agent has to read every session and can never act on.

What's left is the part that actually transfers: how the model talks, how it pushes back, how it reasons when it's past the edge of what it knows. That's what lives in [`skills/incarnate/SKILL.md`](skills/incarnate/SKILL.md).

## Harnessed

Carried into the spec, reworded into one continuous voice.

| Source section | Lines | What survived |
|---|---|---|
| tone_and_formatting | 54–67 | Warm, prose-first, one question per reply, treat them as a capable adult |
| lists_and_bullets | 68–76 | Minimal formatting; a refusal stays prose, never a bulleted list |
| evenhandedness | 120–132 | Strongest case each way, the counter-case even for views you hold, no flattening to yes/no |
| responding_to_mistakes_and_criticism | 134–140 | Own it once, fix it, stay on the problem — no groveling |
| user_wellbeing (voice slice only) | 82–110 | Don't psychoanalyze or assign motives they didn't name; don't cling |
| knowledge_cutoff | 142–150 | Honesty about the edges; search rather than guess on what's changed |
| core_search_behaviors | 424–446 | Look up an unrecognized name instead of confabulating; scale effort to the question |
| skills / additional_skills_reminder | 287–305, 418–420 | Read the relevant skill before you write, create, or run |
| tone_and_formatting (file check) | 66 | Don't assume a file is present because the conversation implies it; check |
| citation_instructions | 1519–1538 | Put a source in your own words; a citation isn't a license to copy |

## Adapted for the command line

Kept in spirit, but the claude.ai mechanics were stripped and the principle reattached to Claude Code's own tools.

| Source section | Lines | What it became |
|---|---|---|
| search_usage_guidelines | 454–476 | Search discipline mapped to WebSearch/WebFetch — the judgment, not the 1–6-word query rules |
| file_creation_advice | 307–319 | The "standalone artifact vs. answer in chat" call, minus the artifact extensions and `/mnt` paths |
| str_replace hygiene | 1200–1216 | After you edit a file, the earlier view is stale — re-read before acting on it again |
| CRITICAL_COPYRIGHT_COMPLIANCE | 478–519 | The restraint ("don't reproduce wholesale") without the 15-word-limit legalese |

## Deliberately left out

| Source section | Lines | Why |
|---|---|---|
| refusal_handling | 32–48 | Anthropic's policy layer, not the voice; Claude Code carries its own |
| harmful_content_safety | 541–549 | Same — safety policy belongs to the platform, not a voice plugin |
| user_wellbeing (crisis handling) | 78–110 | Same; only the anti-diagnosis respect trait was kept as voice |
| legal_and_financial_advice | 50–52 | Kept the "facts, not directives" respect trait; dropped the "I'm not a lawyer" disclaimer |
| product_information | 8–31 | Consumer product lineup; meaningless at the CLI |
| anthropic_reminders | 112–118 | Classifier/reminder infrastructure |
| memory_system | 152–155 | claude.ai account feature |
| persistent_storage_for_artifacts | 157–236 | `window.storage` — no such thing in Claude Code |
| mcp_app_suggestions | 238–286 | Consumer connector choreography (`suggest_connectors`, opt-in flow) |
| computer_use (environment) | 321–416 | Ubuntu sandbox, `/mnt` paths, `present_files`, artifact rendering, package flags |
| using_image_search_tool | 567–613 | No image search tool at the CLI |
| Tool Definitions | 615–1350 | Consumer tool schemas; Claude Code has its own tool surface |
| Identity Preamble | 1351–1358 | Frames the claude.ai/app environment, not the CLI |
| anthropic_api_in_artifacts ("Claudeception") | 1359–1517 | The artifact-embedded API; no artifacts in Claude Code |
| User Context | 1540–1542 | Runtime location injection |
| available_skills | 1544–1562 | Consumer skill routing metadata |
| network_configuration | 1564–1570 | Consumer bash egress allowlist |
| filesystem_configuration | 1572–1581 | Consumer `/mnt` directory structure |
