#!/usr/bin/env python3
"""Add Cloudflare Web Analytics to HTML pages in this TEST repository only.

Run: python3 scripts/cloudflare_tracking_patch.py
Apply: python3 scripts/cloudflare_tracking_patch.py --apply
"""
from pathlib import Path
import argparse
import re

TOKEN = "359d171d53cd46aea940a671a553da5c"
SCRIPT = (
    "<!-- Cloudflare Web Analytics -->"
    "<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' "
    "data-cf-beacon='{\"token\": \"" + TOKEN + "\"}'></script>"
    "<!-- End Cloudflare Web Analytics -->"
)
ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {".git", "node_modules", "vendor", "dist", "build"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Write changes (default: dry run)")
    args = parser.parse_args()
    changed = skipped = errors = 0
    for path in sorted(ROOT.rglob("*.html")):
        if any(part in EXCLUDED for part in path.relative_to(ROOT).parts):
            continue
        try:
            raw = path.read_bytes()
            if b"static.cloudflareinsights.com/beacon.min.js" in raw or TOKEN.encode() in raw:
                skipped += 1
                continue
            matches = list(re.finditer(rb"</head\s*>", raw, flags=re.IGNORECASE))
            if len(matches) != 1:
                print(f"REVIEW (head count {len(matches)}): {path.relative_to(ROOT)}")
                errors += 1
                continue
            at = matches[0].start()
            newline = b"\r\n" if b"\r\n" in raw[:at] else b"\n"
            addition = SCRIPT.encode("utf-8") + newline
            print(f"{'PATCH' if args.apply else 'WOULD PATCH'}: {path.relative_to(ROOT)}")
            if args.apply:
                path.write_bytes(raw[:at] + addition + raw[at:])
            changed += 1
        except (OSError, UnicodeError) as exc:
            errors += 1
            print(f"ERROR: {path.relative_to(ROOT)}: {exc}")
    print(f"Summary: {'patched' if args.apply else 'planned'}={changed}, existing={skipped}, review={errors}")
    if errors:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
