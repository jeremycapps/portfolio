#!/usr/bin/env python3
"""PreToolUse hook: route unscoped recursive `grep -r` -> `git grep`.

Two-stage design:

  route_decision(cmd)   decides IF a command should be routed at all (the
                        original gate: recursive file-grep, in a git work
                        tree, not an ignored-dir target, no --no-ignore).

  plan_command(cmd)     decides WHAT to do when it should route:
                          ('rewrite', new_cmd)  -> hand back an equivalent
                                                   `git grep` via updatedInput
                          ('deny',   reason)    -> the original advisory deny,
                                                   used as the SAFE FLOOR when a
                                                   clause can't be rewritten
                                                   confidently
                          ('pass',   None)      -> not our business

Rewriting is "sure, else deny": a recursive grep clause is rewritten only when
it can be parsed and translated into a provably-equivalent `git grep`. Anything
unmodeled (unbalanced quotes, command substitution, unknown flags, literal path
+ --include together, -e/-f, env prefixes) falls back to deny — never a silent,
semantics-changing rewrite. Compound commands are split at top level and only
their recursive-grep clauses are rewritten; every other clause passes untouched.

Every function is pure so the whole thing can be unit-tested and corpus-replayed
with no git and no subprocess; main() is a thin stdin->JSON wrapper.
"""
import json
import os
import re
import shlex
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG = Path(os.environ.get("ROUTE_GREP_LOG",
                          str(Path(__file__).with_name("route-grep.log"))))


def _log(decision, command):
    try:
        with LOG.open("a") as f:
            f.write(json.dumps({
                "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "decision": decision,
                "command": (command or "")[:300],
            }) + "\n")
    except Exception:
        pass


REC = re.compile(r"(^|[;&|]\s*|\s)grep\s+-[a-zA-Z]*[rR][a-zA-Z]*\b")

# An ignored/generated dir used as a PATH target = intended escape (leave it).
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


# --------------------------------------------------------------------------- #
# Rewrite path
# --------------------------------------------------------------------------- #

_REDIR = re.compile(r"^(\d*>>?|\d*>&\d*|&>|<)")
_KEEP_SHORT = set("niIlLwocvhHExF")          # grep short flags git grep also takes
_ENV = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")


def split_top_level(cmd):
    """Split a shell command into contiguous tokens at TOP LEVEL only, so that
    ''.join(t.text for t in parts) == cmd. Operators (; && || | newline) become
    kind='op'; everything else is kind='seg'. Quotes and $()/`` are treated as
    opaque balanced spans. Returns None if quotes or those spans are unbalanced
    (fail closed)."""
    parts, buf = [], []
    i, n = 0, len(cmd)
    sq = dq = False
    while i < n:
        c = cmd[i]
        if sq:
            buf.append(c); sq = (c != "'"); i += 1; continue
        if dq:
            if c == "\\" and i + 1 < n:
                buf.append(c); buf.append(cmd[i + 1]); i += 2; continue
            buf.append(c); dq = (c != '"'); i += 1; continue
        if c == "'":
            buf.append(c); sq = True; i += 1; continue
        if c == '"':
            buf.append(c); dq = True; i += 1; continue
        if c == "\\" and i + 1 < n:
            buf.append(c); buf.append(cmd[i + 1]); i += 2; continue
        if c == "`":
            j = cmd.find("`", i + 1)
            if j == -1:
                return None
            buf.append(cmd[i:j + 1]); i = j + 1; continue
        if c == "$" and i + 1 < n and cmd[i + 1] == "(":
            depth, j = 0, i + 1
            while j < n:
                if cmd[j] == "(":
                    depth += 1
                elif cmd[j] == ")":
                    depth -= 1
                    if depth == 0:
                        break
                j += 1
            if j >= n or depth != 0:
                return None
            buf.append(cmd[i:j + 1]); i = j + 1; continue
        # top-level operator?
        op = None
        if c == "\n":
            op = "\n"
        elif cmd.startswith("&&", i) or cmd.startswith("||", i):
            op = cmd[i:i + 2]
        elif c in ";|&":
            op = c
        if op is not None:
            parts.append(("seg", "".join(buf))); buf = []
            parts.append(("op", op)); i += len(op); continue
        buf.append(c); i += 1
    if sq or dq:
        return None
    parts.append(("seg", "".join(buf)))
    return parts


def _unquote(s):
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "'\"":
        return s[1:-1]
    return s


def is_routable_grep_segment(seg):
    """True if this single top-level segment is a recursive grep we should
    route (mirrors route_decision's per-clause checks; work-tree is decided at
    the whole-command level, not here)."""
    core = seg.strip()
    if "git grep" in core or not REC.search(core):
        return False
    if "--no-ignore" in core or re.search(r"\s-[a-tv-z]*u[a-z]*\b", core):
        return False
    if IGN.search(core):
        return False
    return True


def rewrite_grep_clause(seg):
    """Translate ONE recursive-grep segment into an equivalent `git grep`
    string, preserving leading/trailing whitespace. Return None if the clause
    is not confidently translatable (caller then denies)."""
    lead = seg[:len(seg) - len(seg.lstrip())]
    trail = seg[len(seg.rstrip()):]
    core = seg.strip()
    if "$(" in core or "`" in core or re.search(r"[<>]\(", core):
        return None                                   # substitution: shlex can't
    if re.search(r"\\[\"']", core):
        return None                                   # escaped quote: shlex unreliable
    try:
        toks = shlex.split(core, posix=False)
    except ValueError:
        return None
    if not toks or toks[0] != "grep":
        return None                                   # env prefix / not plain grep

    flags, pattern, paths = [], None, []
    includes, excludes, redirects = [], [], []
    end_opts = False
    for tok in toks[1:]:
        if _REDIR.match(tok):
            redirects.append(tok); continue
        if not end_opts and tok == "--":
            end_opts = True; continue
        if not end_opts and tok.startswith("--"):
            if tok.startswith("--include="):
                includes.append(_unquote(tok[len("--include="):])); continue
            if tok.startswith("--exclude="):
                excludes.append(_unquote(tok[len("--exclude="):])); continue
            if tok == "--recursive":
                continue
            if tok == "--ignore-case":
                flags.append("i"); continue
            if tok == "--line-number":
                flags.append("n"); continue
            if tok == "--files-with-matches":
                flags.append("l"); continue
            return None                               # unmodeled long flag
        if not end_opts and tok.startswith("-") and len(tok) > 1 and pattern is None:
            letters = tok[1:]
            if "e" in letters or "f" in letters or "=" in letters:
                return None                           # -e/-f take an arg; punt
            cleaned = [c for c in letters if c not in "rR"]
            if any(c not in _KEEP_SHORT for c in cleaned):
                return None                           # unknown short flag
            if cleaned:
                flags.append("".join(cleaned))
            continue
        if pattern is None:
            pattern = tok
        else:
            paths.append(tok)

    if pattern is None:
        return None

    real_paths = [p for p in paths if p not in (".", "./")]
    specs = _build_pathspecs(real_paths, includes, excludes)
    if specs is None:
        return None                                   # unmodeled path/glob combo

    out = ["git", "grep"]
    if flags:
        out.append("-" + "".join(flags))
    out.append(pattern)
    if specs:
        out.append("--")
        out.extend(specs)
    result = " ".join(out)
    if redirects:
        result += " " + " ".join(redirects)
    candidate = lead + result + trail
    if split_top_level(candidate) is None:
        return None                                   # never emit unbalanced output
    return candidate


def _dir_like(p):
    """A path grep's --include filters *within* — a directory, not a file.
    Conservative: ends with / or its basename has no extension."""
    base = p.strip("'\"").rstrip("/").rsplit("/", 1)[-1]
    return p.endswith("/") or "." not in base or base in (".", "..")


def _build_pathspecs(real_paths, includes, excludes):
    """Turn grep paths + --include/--exclude globs into git grep pathspecs, or
    None if the combination isn't safely equivalent (caller then denies).

      paths only            -> literal paths
      globs only (path was .) -> quoted globs (OR)
      paths AND includes    -> ':(glob)<dir>/**/<glob>' cross product == grep's
                               (path AND glob) semantics
      paths AND excludes    -> unmodeled (deny)
    """
    if real_paths and includes:
        if excludes:
            return None                               # path + exclude: unmodeled
        if any(("/" in g or "'" in g or '"' in g) for g in includes):
            return None                               # dir-qualified/quoted glob
        if not all(_dir_like(p) for p in real_paths):
            return None                               # include filters a file path
        specs = []
        for p in real_paths:
            d = p.strip("'\"").rstrip("/")
            if "'" in d:
                return None                            # can't single-quote safely
            for g in includes:
                specs.append("':(glob)%s/**/%s'" % (d, g))
        return specs
    if real_paths and excludes:
        return None                                   # path + exclude: unmodeled
    specs = list(real_paths)
    specs += ["'%s'" % g for g in includes]
    specs += ["':!%s'" % g for g in excludes]
    return specs


def plan_command(command, cwd=None, in_work_tree=None):
    """Decide what to do with a command. Returns one of:
       ('rewrite', new_command) | ('deny', reason) | ('pass', None)."""
    if route_decision(command, cwd=cwd, in_work_tree=in_work_tree) is None:
        return ("pass", None)

    parts = split_top_level(command)
    if parts is None:
        return ("deny", REASON)                       # can't parse safely

    out, changed = [], False
    for kind, text in parts:
        if kind == "op":
            out.append(text); continue
        if is_routable_grep_segment(text):
            rw = rewrite_grep_clause(text)
            if rw is None:
                return ("deny", REASON)               # a routable grep we can't fix
            out.append(rw); changed = True
        else:
            out.append(text)                          # untouched (echo, cat, ...)
    if not changed:
        return ("deny", REASON)
    return ("rewrite", "".join(out))


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if data.get("tool_name") != "Bash":
        sys.exit(0)
    cmd = (data.get("tool_input") or {}).get("command", "")
    action, payload = plan_command(cmd, cwd=data.get("cwd"))

    if action == "rewrite":
        _log("rewrote", cmd)
        print(json.dumps({
            "systemMessage": "grep-route: rewrote `grep -r` → `git grep` "
                             "(tracked-only, scoped, ~250x faster).",
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "permissionDecisionReason":
                    "Auto-routed recursive grep to an equivalent git grep.",
                "updatedInput": {**(data.get("tool_input") or {}), "command": payload},
            }
        }))
    elif action == "deny":
        _log("routed", cmd)
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": payload,
            }
        }))
    else:
        _log("passed", cmd)
    sys.exit(0)


if __name__ == "__main__":
    main()
