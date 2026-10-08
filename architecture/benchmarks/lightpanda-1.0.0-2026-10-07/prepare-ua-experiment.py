#!/usr/bin/env python3
"""Make an isolated ARM64 macOS v1 diagnostic copy; never edit an installation."""
import argparse
import hashlib
from pathlib import Path
import subprocess
import sys

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('official_binary', type=Path)
parser.add_argument('output_copy', type=Path)
args = parser.parse_args()
if sys.platform != 'darwin':
    parser.error('This pinned diagnostic patch is for the ARM64 macOS release only.')
if args.official_binary.resolve() == args.output_copy.resolve() or args.output_copy.exists():
    parser.error('Choose a new output path, separate from the installed binary.')
original = args.official_binary.read_bytes()
expected = '955440053a84754dd64c62f970449a56a2b350cdf43ea5f2e809a73047b8173d'
if hashlib.sha256(original).hexdigest() != expected:
    parser.error('Input does not match the official Lightpanda 1.0.0 ARM64 macOS asset.')
patched = original
for old, new, count in [(b'mozilla', b'mozil_x', 5), (b'Sec-Ch-Ua', b'X-ec-H-UA', 4)]:
    if patched.count(old) != count or len(old) != len(new):
        parser.error('Expected patch locations do not match.')
    patched = patched.replace(old, new)
args.output_copy.parent.mkdir(parents=True, exist_ok=True)
with args.output_copy.open('xb') as output:
    output.write(patched)
args.output_copy.chmod(0o700)
subprocess.run(['codesign', '--force', '--sign', '-', str(args.output_copy)], check=True)
print(f'Experimental copy: {args.output_copy.resolve()}')
print(f'SHA256: {hashlib.sha256(args.output_copy.read_bytes()).hexdigest()}')
print('This changes UA validation and fixed client-hint header names; it is not a stock release.')
