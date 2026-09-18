#!/usr/bin/env python3
"""PreToolUse hook: route unscoped recursive `grep -r` -> `git grep`.

Automates only the STATELESS decision (which tool), never granularity. Fires
only on the convergent case: a recursive file-grep, inside a git work tree,
not aimed at an ignored/generated dir, without an explicit --no-ignore escape.
Everything else passes untouched (fail-open).

The decision is a pure function (route_decision) so it can be unit-tested with
no git and no subprocess; main() is a thin stdin->JSON wrapper.
"""
import json
import re
import subprocess
import sys

REC = re.compile(r"(^|[;&|]\s*|\s)grep\s+-[a-zA-Z]*[rR][a-zA-Z]*\b")

# An ignored/generated dir used as a PATH target = intended escape (leave it).
# node_modules/.next/.prerender are safe to match bare (never search *terms*);
# the ordinary words (dist/build/out/coverage/test-results) match only with a
# trailing slash, so `grep -rn build .` (searching for the word "build") still
# routes instead of being mistaken for a path.
IGN = re.compile(
    r"(^|\s)(\./)?(node_modules|\.next|\.prerender)(/|\s|$)"
    r"|(^|\s)(\./)?(dist|build|out|coverage|test-results)/"
)

REASON = (
    "Recursive `grep -r` here walks node_modules/.git and floods context. "
    "You're in a git work tree — use `git grep` instead (tracked-only, scoped "
    "by .gitignore, ~250x faster and ~10x less output). Keep the same pattern "
    "and flags (-n/-i/-l); pass paths as a pathspec, e.g. "
    "`git grep -n PATTERN -- 'src/**' '*.ts'`. If you truly need "
    "ignored/generated/untracked files, re-run with `--no-ignore` or an "
    "explicit path — that's the intended escape."
)


def _in_work_tree(cwd) -> bool:
    try:
        r = subprocess.run(["git", "rev-parse", "--is-inside-work-tree"],
                           cwd=cwd, capture_output=True, text=True, timeout=2)
        return r.stdout.strip() == "true"
    except Exception:
        return False


def route_decision(command, cwd=None, in_work_tree=None):
    """Return the deny-reason if this command should be routed to git grep,
    else None. `in_work_tree` may be injected to avoid touching git (tests)."""
    cmd = command or ""
    if "git grep" in cmd or not REC.search(cmd):
        return None                                   # not a recursive grep
    if "--no-ignore" in cmd or re.search(r"\s-[a-tv-z]*u[a-z]*\b", cmd):
        return None                                   # explicit "search ignored"
    if IGN.search(cmd.split("|")[0]):
        return None                                   # targeting a generated dir
    itw = in_work_tree if in_work_tree is not None else _in_work_tree(cwd)
    if not itw:
        return None                                   # not in a git work tree
    return REASON


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if data.get("tool_name") != "Bash":
        sys.exit(0)
    cmd = (data.get("tool_input") or {}).get("command", "")
    reason = route_decision(cmd, cwd=data.get("cwd"))
    if reason:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        }))
    sys.exit(0)


if __name__ == "__main__":
    main()
