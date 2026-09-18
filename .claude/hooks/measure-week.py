#!/usr/bin/env python3
"""Weekly readout for the grep->git grep routing hook.

Two data sources:
  1. .claude/hooks/route-grep.log — every grep-initial command the hook saw,
     tagged routed (fired) or passed. Direct count of prevented slow searches.
  2. ~/.claude/projects/*portfolio*/**.jsonl — the session transcripts, to
     measure ADOPTION over the window: grep -r attempts vs git grep vs the
     built-in Grep tool (the hook log can't see git grep / Grep — they don't
     start with `grep`).

Baseline (pre-hook, measured 2026-09-18 over 140 sessions):
  291 unscoped `grep -r`  vs  35 Grep-tool + 7 git grep + 18 rg
  -> ~87% of recursive searches took the slow path.

Per-fire savings used for estimates (from the benchmark, term 'Domain',
634MB node_modules): ~8s wall time, ~5,100 tokens of context. Both are
UPPER-BOUND estimates — many real greps carried --include and ran faster.

Usage:  python3 .claude/hooks/measure-week.py [--since YYYY-MM-DD]
"""
import argparse
import importlib.util
import json
import re
from collections import Counter
from datetime import datetime, timezone, date
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOG = HERE / "route-grep.log"
PROJECTS = Path.home() / ".claude" / "projects"

# reuse the hook's own classifiers so the report agrees with the hook
spec = importlib.util.spec_from_file_location("route_grep", HERE / "route-grep.py")
rg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rg)

SAVE_MS = 8000          # upper-bound wall time saved per routed search
SAVE_TOK = 5100         # upper-bound context tokens saved per routed search
BASELINE_SLOW = 0.87    # pre-hook slow-path share


def parse_ts(s):
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None


def read_hook_log(since):
    routed, passed_rec, passed_other = [], [], []
    if not LOG.exists():
        return routed, passed_rec, passed_other
    for line in LOG.open(errors="replace"):
        try:
            e = json.loads(line)
        except Exception:
            continue
        ts = parse_ts(e.get("ts", ""))
        if ts and ts.date() < since:
            continue
        cmd = e.get("command", "")
        if e.get("decision") == "routed":
            routed.append((ts, cmd))
        elif rg.REC.search(cmd):                 # a recursive grep that escaped
            passed_rec.append((ts, cmd))
        else:
            passed_other.append((ts, cmd))       # non-recursive grep (fine)
    return routed, passed_rec, passed_other


def scan_transcripts(since):
    """Adoption over the window, from the session JSONL."""
    grep_r = git_grep = grep_tool = 0
    dirs = [p for p in PROJECTS.iterdir()
            if p.is_dir() and p.name.startswith("-Users-jeremycapps-Dev-portfolio")]
    for d in dirs:
        for f in d.glob("*.jsonl"):
            for line in f.open(errors="replace"):
                try:
                    o = json.loads(line)
                except Exception:
                    continue
                if o.get("type") != "assistant":
                    continue
                ts = parse_ts(o.get("timestamp", ""))
                if ts and ts.date() < since:
                    continue
                msg = o.get("message")
                if not isinstance(msg, dict):
                    continue
                for b in msg.get("content", []) if isinstance(msg.get("content"), list) else []:
                    if not (isinstance(b, dict) and b.get("type") == "tool_use"):
                        continue
                    if b.get("name") == "Grep":
                        grep_tool += 1
                    elif b.get("name") == "Bash":
                        cmd = (b.get("input") or {}).get("command", "")
                        if "git grep" in cmd:
                            git_grep += 1
                        elif rg.REC.search(cmd):
                            grep_r += 1
    return grep_r, git_grep, grep_tool


def fmt_dur(ms):
    s = ms / 1000
    return f"{s:.0f}s" if s < 90 else f"{s/60:.1f}m"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", default="2026-09-18",
                    help="measurement start, YYYY-MM-DD (default: hook install date)")
    args = ap.parse_args()
    since = date.fromisoformat(args.since)
    today = datetime.now(timezone.utc).date()
    day = (today - since).days + 1

    routed, passed_rec, passed_other = read_hook_log(since)
    grep_r, git_grep, grep_tool = scan_transcripts(since)

    print(f"grep→git grep routing — live measurement")
    print(f"window: {since} → {today}  (day {day} of 7)")
    print("=" * 52)

    n = len(routed)
    print(f"\nPREVENTED slow searches (hook fired):   {n}")
    print(f"recursive greps that used the escape:   {len(passed_rec)}")
    print(f"non-recursive greps (left alone):       {len(passed_other)}")

    print(f"\nEstimated savings (upper bound):")
    print(f"  time not spent walking node_modules:  ~{fmt_dur(n*SAVE_MS)}")
    print(f"  context tokens kept clean:            ~{n*SAVE_TOK:,}")

    by_day = Counter(ts.date().isoformat() for ts, _ in routed if ts)
    if by_day:
        print(f"\nfires by day:")
        for d in sorted(by_day):
            print(f"  {d}   {'█'*by_day[d]} {by_day[d]}")

    total_rec = grep_r + git_grep + grep_tool
    print(f"\nADOPTION this window (from transcripts):")
    print(f"  grep -r attempts:   {grep_r}")
    print(f"  git grep:           {git_grep}")
    print(f"  Grep tool:          {grep_tool}")
    if total_rec:
        slow = grep_r / total_rec
        print(f"  slow-path share:    {slow*100:.0f}%   (pre-hook baseline: {BASELINE_SLOW*100:.0f}%)")
        delta = (BASELINE_SLOW - slow) * 100
        print(f"  change vs baseline: {delta:+.0f} pts")
    else:
        print("  (no recursive searches recorded yet this window)")

    if len(passed_rec):
        print(f"\nescape cases (verify these truly needed unscoped search):")
        for ts, cmd in passed_rec[:8]:
            print(f"  {cmd[:88]}")


if __name__ == "__main__":
    main()
