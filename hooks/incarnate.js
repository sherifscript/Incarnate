#!/usr/bin/env node
// incarnate — Claude Code SessionStart hook.
//
// Emits the Fable voice + build spec as session context (raw stdout becomes
// injected context). The single source of truth is skills/incarnate/SKILL.md —
// we strip its frontmatter and print the body, so there's nothing to keep in
// sync. Also stamps ~/.claude/.incarnate-active with this session's id: the
// statusline badge matches that id, so it only renders for a session that
// actually loaded Incarnate, not a stale flag left by an uninstall or a stray
// manual run of this hook.
// Disable for a session with INCARNATE=off.

const fs = require('fs');
const path = require('path');
const os = require('os');

const flag = path.join(os.homedir(), '.claude', '.incarnate-active');

if ((process.env.INCARNATE || '').toLowerCase() === 'off') {
  try { fs.unlinkSync(flag); } catch (e) {} // hide the badge when turned off
  process.exit(0);
}

// Stamp the flag with this session's id (read from the hook's stdin JSON) so
// the statusline can tell a live Incarnate session from a stale flag. Empty is
// fine — the statusline won't match it, which is the safe (no-badge) default.
let sessionId = '';
try {
  if (!process.stdin.isTTY) {
    sessionId = String(JSON.parse(fs.readFileSync(0, 'utf8')).session_id || '');
  }
} catch (e) {}
try { fs.writeFileSync(flag, sessionId); } catch (e) {} // best-effort

const skill = path.join(__dirname, '..', 'skills', 'incarnate', 'SKILL.md');
let out = '';
try {
  out = fs.readFileSync(skill, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
} catch (e) {
  // best-effort: a missing skill file just means no injection this session.
}

// One-time nudge: if no statusline is configured, tell Claude how to add the
// [incarnate] badge. Any existing statusLine silences this.
try {
  const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
  const hasStatusline = fs.existsSync(settingsPath)
    && !!JSON.parse(fs.readFileSync(settingsPath, 'utf8')).statusLine;
  if (!hasStatusline) {
    const win = process.platform === 'win32';
    const script = path.join(__dirname, win ? 'incarnate-statusline.ps1' : 'incarnate-statusline.sh');
    const cmd = win
      ? `powershell -NoProfile -ExecutionPolicy Bypass -File "${script}"`
      : `bash "${script}"`;
    out += '\n\nSTATUSLINE SETUP AVAILABLE: Incarnate ships a status-bar badge. To enable it, '
      + 'add this to ~/.claude/settings.json: "statusLine": { "type": "command", "command": '
      + JSON.stringify(cmd) + ' }. Offer to set this up for the user.';
  }
} catch (e) {
  // best-effort; never block session start over the statusline nudge.
}

process.stdout.write(out);
