"""Root homepage regression checks. No production writes or student data access."""
from __future__ import annotations

import hashlib
import io
import json
import os
from pathlib import Path
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'homepage-qa'
OUT.mkdir(exist_ok=True)
REPORT: dict = {'checks': [], 'deployment_verified': False, 'tested_commit': os.getenv('GITHUB_SHA', 'local')}
BASE = 'https://panpanhuang332.github.io/research_methods/'


def check(name: str, condition: bool, detail=None) -> None:
    REPORT['checks'].append({'name': name, 'passed': bool(condition), 'detail': detail})
    if not condition:
        raise AssertionError(name + ': ' + str(detail))


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def inspect(page, label: str, url: str) -> None:
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    for width, height in [(1440, 1000), (768, 1024), (390, 844), (375, 812), (320, 667)]:
        page.set_viewport_size({'width': width, 'height': height})
        response = page.goto(url, wait_until='networkidle', timeout=45000)
        prefix = f'{label}-{width}'
        check(prefix + '-http-200', response is not None and response.status == 200)
        check(prefix + '-title', '古今聯合入口' in page.title())
        check(prefix + '-no-page-overflow', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        left = page.locator('.ancient').bounding_box()
        right = page.locator('.modern').bounding_box()
        check(prefix + '-side-by-side', abs(left['y']-right['y']) < 1 and left['x']+left['width'] <= right['x']+1)
        check(prefix + '-both-full-columns', left['width'] >= width*.48 and right['width'] >= width*.48)
        check(prefix + '-ancient-unavailable', page.locator('.ancient button').is_disabled())
        check(prefix + '-modern-href', page.locator('#modern-entry').get_attribute('href') == './visuals/')
        btn = page.locator('#modern-entry').bounding_box()
        check(prefix + '-entry-in-first-screen', btn['y']+btn['height'] <= height, btn)
        check(prefix + '-minimum-touch-target', btn['height'] >= 44)
        check(prefix + '-no-platform-login', page.locator('a,button').filter(has_text='ChatGPT').count() == 0)
        check(prefix + '-scope-disclosure', '原課程評量、教師評閱、留言與學習紀錄尚未移轉' in page.locator('.scope').inner_text())
        for selector in ['#ancient-title', '#modern-title', '.ancient .cta', '#modern-entry']:
            check(prefix + '-text-fits-' + selector, page.locator(selector).evaluate('(el)=>el.scrollWidth <= el.clientWidth + 1'))
        images = page.evaluate('''async () => {
            const result = [];
            for (const el of document.querySelectorAll('.art')) {
                const bg = getComputedStyle(el).backgroundImage;
                const src = bg.slice(5, -2);
                const ok = await new Promise(resolve => {
                    const im = new Image();
                    im.onload = () => resolve({loaded: true, width: im.naturalWidth, height: im.naturalHeight});
                    im.onerror = () => resolve({loaded: false, background: bg.slice(0, 100)});
                    im.src = src;
                });
                result.push(ok);
            }
            return result;
        }''')
        check(prefix + '-scene-assets-decode', all(im['loaded'] and im['width'] > 0 for im in images), images)
        if width in [1440, 390, 320]:
            page.screenshot(path=str(OUT / f'{prefix}.png'), full_page=True)
    page.locator('#modern-entry').click()
    page.wait_for_selector('research-chapter-visuals', timeout=30000)
    check(label + '-modern-link-opens-course', '/visuals/' in page.url and page.locator('#nav a').count() == 18)
    check(label + '-first-chapter-renders', page.locator('research-chapter-visuals .card').count() == 2)
    check(label + '-no-javascript-errors', not errors, errors)


def remote_matches() -> bool:
    for path in ['index.html', 'assets/portal-art.css']:
        suffix = '?homepage-check=' + REPORT['tested_commit'][:12]
        url = BASE + ('' if path == 'index.html' else path) + suffix
        req = Request(url, headers={'User-Agent': 'research-methods-homepage-check', 'Cache-Control': 'no-cache'})
        with urlopen(req, timeout=20) as response:
            data = response.read()
            if response.status != 200 or hashlib.sha256(data).digest() != hashlib.sha256((ROOT/path).read_bytes()).digest():
                return False
    return True


def main() -> None:
    check('root-index-exists', (ROOT / 'index.html').is_file())
    check('scene-css-exists', (ROOT / 'assets/portal-art.css').is_file())
    check('visuals-preserved', (ROOT / 'visuals/index.html').is_file() and (ROOT / 'visuals/chapter-visuals.js').is_file())
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    local = f'http://127.0.0.1:{server.server_address[1]}/'
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            inspect(page, 'local', local)
            if os.getenv('GITHUB_ACTIONS') == 'true':
                deadline = time.monotonic() + 240
                last_error = 'Deployment bytes did not match yet'
                while time.monotonic() < deadline:
                    try:
                        if remote_matches():
                            REPORT['deployment_verified'] = True
                            break
                    except Exception as exc:
                        last_error = str(exc)
                    time.sleep(10)
                check('public-pages-matches-committed-homepage', REPORT['deployment_verified'], last_error if not REPORT['deployment_verified'] else BASE)
                inspect(browser.new_page(), 'live', BASE + '?homepage-check=' + REPORT['tested_commit'][:12])
            browser.close()
    finally:
        server.shutdown()


try:
    main()
    REPORT['status'] = 'passed'
except Exception as exc:
    REPORT['status'] = 'failed'
    REPORT['error'] = str(exc)
    raise
finally:
    REPORT['passed'] = sum(c['passed'] for c in REPORT['checks'])
    REPORT['total'] = len(REPORT['checks'])
    (OUT / 'report.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in REPORT.items() if k != 'checks'}, ensure_ascii=False))
