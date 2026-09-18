#!/usr/bin/env python3
"""Test suite for the grep->git grep routing hook.

Run:  python3 .claude/hooks/test_route_grep.py
Exits nonzero if any case fails. No pytest dependency; no network.

Covers the two axes the hook decides on:
  - FIRE  : a recursive grep inside a work tree that should be routed
  - PASS  : every escape branch (not recursive, stream grep, ignored-dir
            target, --no-ignore, not a repo, already git grep, non-grep)
Plus an end-to-end check that the deployed script emits the deny JSON over
stdin, against a real temporary git repo.
"""
import importlib.util
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HOOK = Path(__file__).with_name("route-grep.py")
spec = importlib.util.spec_from_file_location("route_grep", HOOK)
rg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rg)

# (name, command, in_work_tree, expect_fire)
CASES = [
    # --- FIRE: routable recursive greps inside a work tree ---
    ("plain recursive",            "grep -rn Domain .",                        True,  True),
    ("include + pipe + head",      "grep -ril X --include=*.ts . | head -40",  True,  True),
    ("recursive into subdir",      "grep -rin foo src/",                       True,  True),
    ("search term == 'build'",     "grep -rn build .",                         True,  True),  # 'build' is the pattern, not a path
    ("search term == 'out'",       "grep -rn out .",                           True,  True),
    ("compound command",           "grep -rn X . ; echo done",                 True,  True),
    ("alternation pattern",        "grep -rn 'libera|atomic' .",               True,  True),

    # --- PASS: escape branches ---
    ("targets dist/ (ignored)",    "grep -rn X dist/",                         True,  False),
    ("targets node_modules",       "grep -rn X node_modules",                  True,  False),
    ("targets ./build/",           "grep -rn X ./build/",                      True,  False),
    ("--no-ignore escape",         "grep -rn X . --no-ignore",                 True,  False),
    ("stream grep (pipe in)",      "ps aux | grep node",                       True,  False),
    ("explicit file, not -r",      "grep -n X src/App.tsx",                    True,  False),
    ("already git grep",           "git grep -n X",                            True,  False),
    ("not a grep at all",          "ls -la && npm test",                       True,  False),
    ("recursive but NOT a repo",   "grep -rn X .",                             False, False),
]


def run_unit():
    passed = failed = 0
    for name, cmd, itw, expect_fire in CASES:
        reason = rg.route_decision(cmd, in_work_tree=itw)
        fired = reason is not None
        ok = fired == expect_fire
        passed += ok
        failed += not ok
        mark = "ok " if ok else "FAIL"
        want = "FIRE" if expect_fire else "PASS"
        got = "FIRE" if fired else "PASS"
        print(f"  [{mark}] {name:28} want={want} got={got}")
        if not ok:
            print(f"         cmd: {cmd!r}")
    return passed, failed


def run_integration():
    """Drive the actual script over stdin against a real temp git repo."""
    print("\nintegration (real script over stdin, real temp git repo):")
    results = []
    with tempfile.TemporaryDirectory() as repo, tempfile.TemporaryDirectory() as nonrepo:
        subprocess.run(["git", "init", "-q"], cwd=repo, check=True)
        (Path(repo) / "f.txt").write_text("x")

        def call(payload):
            p = subprocess.run([sys.executable, str(HOOK)],
                               input=json.dumps(payload), capture_output=True, text=True)
            out = p.stdout.strip()
            if not out:
                return None
            return json.loads(out)["hookSpecificOutput"]["permissionDecision"]

        # routable, in a real repo -> deny
        d = call({"tool_name": "Bash", "tool_input": {"command": "grep -rn X ."}, "cwd": repo})
        results.append(("routable in real repo -> deny", d == "deny"))
        print(f"  [{'ok ' if d=='deny' else 'FAIL'}] routable in real repo -> {d!r} (want 'deny')")

        # same command, NOT a repo -> allow (empty)
        d = call({"tool_name": "Bash", "tool_input": {"command": "grep -rn X ."}, "cwd": nonrepo})
        results.append(("routable outside repo -> allow", d is None))
        print(f"  [{'ok ' if d is None else 'FAIL'}] routable outside repo -> {d!r} (want allow/None)")

        # non-Bash tool -> allow
        d = call({"tool_name": "Read", "tool_input": {"file_path": "x"}, "cwd": repo})
        results.append(("non-Bash tool -> allow", d is None))
        print(f"  [{'ok ' if d is None else 'FAIL'}] non-Bash tool -> {d!r} (want allow/None)")

    return sum(ok for _, ok in results), sum(not ok for _, ok in results)


if __name__ == "__main__":
    print("unit (route_decision, hermetic):")
    up, uf = run_unit()
    ip, if_ = run_integration()
    total_pass, total_fail = up + ip, uf + if_
    print(f"\n{total_pass} passed, {total_fail} failed")
    sys.exit(1 if total_fail else 0)
