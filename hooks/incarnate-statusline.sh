#!/usr/bin/env bash
# incarnate — Claude Code statusline badge (POSIX).
# Shows the badge only for the session that loaded Incarnate. The SessionStart
# hook stamps the flag with the session id; we match it here so a stale flag
# (after an uninstall, or a stray manual hook run) can't light a false badge.
flag="$HOME/.claude/.incarnate-active"
[ -f "$flag" ] || exit 0

in="$(cat)"
session="$(printf '%s' "$in" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
# Known session id that doesn't match the stamped one → flag is from another
# session, show nothing. No id readable → fall back to showing the badge.
if [ -n "$session" ]; then
  active="$(tr -d '[:space:]' < "$flag")"
  [ "$active" = "$session" ] || exit 0
fi

e=$'\033'; orange="${e}[38;5;208m"; dim="${e}[38;5;245m"; reset="${e}[0m"
model="$(printf '%s' "$in" | sed -n 's/.*"display_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
if [ -n "$model" ]; then
  printf '%s[incarnate]%s %s%s%s' "$orange" "$reset" "$dim" "$model" "$reset"
else
  printf '%s[incarnate]%s' "$orange" "$reset"
fi
