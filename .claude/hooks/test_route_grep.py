#!/usr/bin/env python3
"""Test suite for the grep->git grep routing hook.

Run:  python3 .claude/hooks/test_route_grep.py
Exits nonzero if any case fails. No pytest dependency; no network.

Three batteries:
  route_decision  — the routing GATE (fire vs pass)
  plan_command    — the ACTION: rewrite (equivalent git grep) / deny (safe
                    floor when a clause can't be translated) / pass
  integration     — the deployed script over stdin against a real temp repo
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

# --- route_decision: does it fire at all? (name, cmd, in_work_tree, fire) ---
GATE = [
    ("plain recursive",         "grep -rn Domain .",                       True,  True),
    ("include + pipe + head",   "grep -ril X --include=*.ts . | head -40", True,  True),
    ("search term == 'build'",  "grep -rn build .",                        True,  True),
    ("targets dist/ (ignored)", "grep -rn X dist/",                        True,  False),
    ("targets node_modules",    "grep -rn X node_modules",                 True,  False),
    ("--no-ignore escape",      "grep -rn X . --no-ignore",                True,  False),
    ("stream grep (pipe in)",   "ps aux | grep node",                      True,  False),
    ("explicit file, not -r",   "grep -n X src/App.tsx",                   True,  False),
    ("already git grep",        "git grep -n X",                           True,  False),
    ("not a grep at all",       "ls -la && npm test",                      True,  False),
    ("recursive but NOT a repo","grep -rn X .",                            False, False),
]

# --- plan_command: (name, cmd, in_work_tree, action, expected_substr) -------
PLAN = [
    # rewrite: exact equivalent git grep
    ("solo",              "grep -rn Domain .",             True, "rewrite", "git grep -n Domain"),
    ("flags -rin+subdir", "grep -rin foo src/",            True, "rewrite", "git grep -in foo -- src/"),
    ("include glob",      "grep -ril X --include=*.ts .",  True, "rewrite", "git grep -il X -- '*.ts'"),
    ("compound &&",       "echo hi && grep -rn X src",     True, "rewrite", "echo hi && git grep -n X -- src"),
    ("compound ; keeps",  "wc -l a.ts; grep -rn X .",      True, "rewrite", "wc -l a.ts; git grep -n X"),
    ("own pipe to head",  "grep -rl X . | head",           True, "rewrite", "git grep -l X | head"),
    ("redirect kept",     "grep -rn X src 2>/dev/null",    True, "rewrite", "git grep -n X -- src 2>/dev/null"),
    ("alternation kept",  r'grep -rn "a\|b" src',          True, "rewrite", r'git grep -n "a\|b" -- src'),
    ("two paths",         "grep -rn X src lib",            True, "rewrite", "git grep -n X -- src lib"),
    # deny: the safe floor — can't translate confidently
    ("unknown flag -P",   "grep -rnP X src",               True, "deny", None),
    ("path + include AND","grep -rn X src --include=*.ts", True, "deny", None),
    ("command subst",     "grep -rn X $(cat p)",           True, "deny", None),
    ("env prefix",        'V=x grep -rn X .',              True, "deny", None),
    ("unbalanced quote",  'grep -rn "X src',               True, "deny", None),
    ("-e takes an arg",   "grep -rn -e X src",             True, "deny", None),
    # pass: not our business
    ("not recursive",     "grep -n X src/App.tsx",         True, "pass", None),
    ("already git grep",  "git grep -n X",                 True, "pass", None),
    ("stream grep",       "ps aux | grep node",            True, "pass", None),
    ("ignored-dir target","grep -rn X node_modules",       True, "pass", None),
    ("--no-ignore",       "grep -rn X . --no-ignore",      True, "pass", None),
    ("not a repo",        "grep -rn X .",                  False,"pass", None),
]


def run_gate():
    p = f = 0
    for name, cmd, itw, fire in GATE:
        got = rg.route_decision(cmd, in_work_tree=itw) is not None
        ok = got == fire
        p += ok; f += not ok
        print(f"  [{'ok ' if ok else 'FAIL'}] {name:28} want={'FIRE' if fire else 'PASS'} "
              f"got={'FIRE' if got else 'PASS'}")
    return p, f


def run_plan():
    p = f = 0
    for name, cmd, itw, action, sub in PLAN:
        got_action, payload = rg.plan_command(cmd, in_work_tree=itw)
        ok = got_action == action and (sub is None or (payload == cmd if action == "pass" else payload) or sub in (payload or ""))
        # tighten: for rewrite, require the expected substring to match exactly
        if action == "rewrite":
            ok = got_action == "rewrite" and payload == sub
        elif action == "deny":
            ok = got_action == "deny"
        else:
            ok = got_action == "pass"
        p += ok; f += not ok
        print(f"  [{'ok ' if ok else 'FAIL'}] {name:22} want={action:7} got={got_action}")
        if not ok:
            print(f"         cmd:  {cmd!r}")
            print(f"         got:  {payload!r}")
            print(f"         want: {sub!r}")
    return p, f


def run_integration():
    print("\nintegration (real script over stdin, real temp git repo):")
    results = []
    with tempfile.TemporaryDirectory() as repo, tempfile.TemporaryDirectory() as nonrepo:
        subprocess.run(["git", "init", "-q"], cwd=repo, check=True)
        (Path(repo) / "f.txt").write_text("x")
        env = {**__import__("os").environ, "ROUTE_GREP_LOG": str(Path(repo) / "test.log")}

        def call(payload):
            r = subprocess.run([sys.executable, str(HOOK)], env=env,
                               input=json.dumps(payload), capture_output=True, text=True)
            out = r.stdout.strip()
            return json.loads(out) if out else None

        # routable + translatable -> allow + updatedInput git grep
        o = call({"tool_name": "Bash", "tool_input": {"command": "grep -rn X ."}, "cwd": repo})
        hso = (o or {}).get("hookSpecificOutput", {})
        ok = (hso.get("permissionDecision") == "allow"
              and hso.get("updatedInput", {}).get("command") == "git grep -n X")
        results.append(ok)
        print(f"  [{'ok ' if ok else 'FAIL'}] routable -> rewrite: "
              f"{hso.get('updatedInput', {}).get('command')!r}")

        # routable but NOT translatable (unknown flag) -> deny floor
        o = call({"tool_name": "Bash", "tool_input": {"command": "grep -rnP X ."}, "cwd": repo})
        d = (o or {}).get("hookSpecificOutput", {}).get("permissionDecision")
        ok = d == "deny"
        results.append(ok)
        print(f"  [{'ok ' if ok else 'FAIL'}] untranslatable -> {d!r} (want 'deny')")

        # same command, NOT a repo -> pass (no output)
        o = call({"tool_name": "Bash", "tool_input": {"command": "grep -rn X ."}, "cwd": nonrepo})
        ok = o is None
        results.append(ok)
        print(f"  [{'ok ' if ok else 'FAIL'}] outside repo -> pass (no output)")

        # non-Bash -> pass
        o = call({"tool_name": "Read", "tool_input": {"file_path": "x"}, "cwd": repo})
        ok = o is None
        results.append(ok)
        print(f"  [{'ok ' if ok else 'FAIL'}] non-Bash -> pass (no output)")

    return sum(results), sum(not r for r in results)


if __name__ == "__main__":
    print("gate (route_decision):")
    gp, gf = run_gate()
    print("\nplan (plan_command):")
    pp, pf = run_plan()
    ip, if_ = run_integration()
    tp, tf = gp + pp + ip, gf + pf + if_
    print(f"\n{tp} passed, {tf} failed")
    sys.exit(1 if tf else 0)
