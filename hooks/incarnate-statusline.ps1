# incarnate — Claude Code statusline badge (Windows / PowerShell).
# Shows the badge only for the session that loaded Incarnate. The SessionStart
# hook stamps the flag with the session id; we match it here so a stale flag
# (after an uninstall, or a stray manual hook run) can't light a false badge.
$flag = Join-Path $HOME ".claude/.incarnate-active"
if (-not (Test-Path $flag)) { exit 0 }

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$model = ""
$session = ""
try {
  $raw = [Console]::In.ReadToEnd()
  if ($raw) {
    $j = $raw | ConvertFrom-Json
    if ($j.model.display_name) { $model = $j.model.display_name }
    if ($j.session_id) { $session = $j.session_id }
  }
} catch {}

# If we know our session id and it isn't the one the hook stamped, this flag
# belongs to another session — show nothing. If we couldn't read a session id
# at all, fall back to showing the badge so the feature still works.
if ($session) {
  $active = ""
  try { $active = ([string](Get-Content $flag -Raw)).Trim() } catch {}
  if ($active -ne $session) { exit 0 }
}

$e = [char]27
$orange = "$e[38;5;208m"; $dim = "$e[38;5;245m"; $reset = "$e[0m"
if ($model) {
  [Console]::Out.Write("$orange[incarnate]$reset $dim$model$reset")
} else {
  [Console]::Out.Write("$orange[incarnate]$reset")
}
