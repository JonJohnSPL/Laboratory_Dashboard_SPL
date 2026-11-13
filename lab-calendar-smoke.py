"""Run: python lab-calendar-smoke.py. Uses installed Chrome, local fixtures, no cloud writes."""
import csv
import json
import re
import subprocess
import tempfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def fixture(name):
    text = (ROOT / name).read_text(encoding='utf-8')
    text = re.sub(r'<script src="(?:app-config|cloud-auth)\.js"></script>', '', text)
    return text.replace('<head>', f'<head><base href="{ROOT.as_uri()}/">')


with tempfile.TemporaryDirectory(prefix='lab-calendar-check-') as directory:
    folder = Path(directory)
    importer = folder / 'import-fixture.html'
    importer.write_text(fixture('import.html'), encoding='utf-8')
    checks = (ROOT / 'lab-calendar.test.js').read_text(encoding='utf-8').replace('__IMPORT_FIXTURE__', importer.as_uri())
    page = fixture('lab-dashboard.html').replace('</body>', f'<script>{checks}</script></body>')
    target = folder / 'calendar-fixture.html'
    target.write_text(page, encoding='utf-8')
    result = subprocess.run([
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--window-size=1440,1100',
        '--allow-file-access-from-files', '--disable-background-networking',
        f'--user-data-dir={folder / "chrome-profile"}', '--dump-dom', '--virtual-time-budget=12000',
        target.as_uri(),
    ], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=45)
    match = re.search(r'<pre id="smoke-result">(.*?)</pre>', result.stdout, re.S)
    if not match:
        raise RuntimeError(f'Chrome returned no test results: {result.stderr[-2500:]}')
    print(match[1])
    assert match[1].startswith('PASS'), match[1]

source = ROOT / 'Pittsburgh WIP Data' / 'WIP Data Import 261113A.csv'
if source.exists():
    dates = defaultdict(set)
    with source.open(newline='', encoding='cp1252') as handle:
        for row in csv.DictReader(handle):
            if row.get('Work Order') and row.get('Due Date'):
                dates[row['Work Order']].add(row['Due Date'])
    print('Latest CSV conflicting WO dates:', json.dumps({key: sorted(value) for key, value in dates.items() if len(value) > 1}))
