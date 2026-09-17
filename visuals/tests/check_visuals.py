"""Read-only browser QA and packaging for the visual companion, not the original site."""
from __future__ import annotations

import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'visuals'
OUT = ROOT / 'visuals-dist'
OUT.mkdir(exist_ok=True)
(OUT / 'svg').mkdir(exist_ok=True)
(OUT / 'screenshots').mkdir(exist_ok=True)
shutil.copytree(SOURCE, OUT / 'visuals', dirs_exist_ok=True)
html = (SOURCE / 'index.html').read_text(encoding='utf-8')
script = (SOURCE / 'chapter-visuals.js').read_text(encoding='utf-8')
needle = '<script src="chapter-visuals.js" defer></script>'
assert html.count(needle) == 1
assert '</script' not in script.lower()
offline = OUT / 'research_methods_18_chapter_visuals.html'
offline.write_text(html.replace(needle, '<script>\n' + script + '\n</script>'), encoding='utf-8')
report = {'checked_at_utc': datetime.now(timezone.utc).isoformat(), 'commit': os.environ.get('GITHUB_SHA'),
          'scope': 'Standalone visual companion only; original course not integrated or tested.',
          'checks': [], 'warnings': [], 'errors': []}

def check(name: str, condition: bool, detail: object = '') -> None:
    report['checks'].append({'name': name, 'passed': bool(condition), 'detail': detail})
    if not condition:
        report['errors'].append({'name': name, 'detail': detail})

try:
    with sync_playwright() as p:
        executable = os.environ.get('CHROMIUM_EXECUTABLE')
        browser = p.chromium.launch(headless=True, **({'executable_path': executable} if executable else {}))
        context = browser.new_context(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1,
                                      reduced_motion='reduce', accept_downloads=True)
        page = context.new_page()
        js_errors = []
        page.on('pageerror', lambda error: js_errors.append(str(error)))
        page.goto((SOURCE / 'index.html').as_uri())
        page.wait_for_selector('research-chapter-visuals .card')
        metadata = page.evaluate('window.ResearchVisuals')
        check('18 chapter metadata records', len(metadata['chapters']) == 18)
        check('36 diagram titles', sum(len(c['figures']) for c in metadata['chapters']) == 36)
        for width in (1440, 768, 375, 320):
            page.set_viewport_size({'width': width, 'height': 960})
            for chapter in range(1, 19):
                page.evaluate('(n) => { location.hash = "chapter-" + n; }', chapter)
                page.wait_for_function('(n) => document.querySelector("research-chapter-visuals").getAttribute("chapter") === String(n)', arg=chapter)
                host = page.locator('research-chapter-visuals')
                check(f'{width}px chapter {chapter}: two diagrams', host.locator('.canvas svg').count() == 2)
                overflow = page.evaluate('({viewport:innerWidth,width:document.documentElement.scrollWidth})')
                check(f'{width}px chapter {chapter}: no page overflow', overflow['width'] <= width + 1, overflow)
                if width == 1440:
                    svgs = host.locator('.canvas svg')
                    for i in range(2):
                        svg = svgs.nth(i)
                        check(f'chapter {chapter} figure {i+1}: accessible description',
                              svg.locator('title').count() == 1 and svg.locator('desc').count() == 1)
                        text_overflow = svg.evaluate('''s => {
                            const v=s.viewBox.baseVal; return [...s.querySelectorAll('text')].map(t=>{
                              const b=t.getBBox();return {text:t.textContent,x:b.x,y:b.y,w:b.width,h:b.height};
                            }).filter(b=>b.x < -1 || b.y < -1 || b.x+b.w > v.width+1 || b.y+b.h > v.height+1);
                        }''')
                        if text_overflow:
                            report['warnings'].append({'chapter': chapter, 'figure': i+1, 'text_outside_svg': text_overflow})
                        data = svg.evaluate('s => s.outerHTML')
                        (OUT / 'svg' / f'week-{chapter:02d}-figure-{i+1}.svg').write_text(data, encoding='utf-8')
                    if chapter in (1, 4, 11, 12, 14, 15):
                        page.screenshot(path=str(OUT / 'screenshots' / f'desktop-week-{chapter:02d}.png'), full_page=True)
                if width == 375 and chapter in (1, 18):
                    page.screenshot(path=str(OUT / 'screenshots' / f'mobile-week-{chapter:02d}.png'), full_page=True)

        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.evaluate('location.hash="chapter-11"')
        page.wait_for_function('document.querySelector("research-chapter-visuals").getAttribute("chapter")==="11"')
        slider = page.locator('input[data-control="outlier"]')
        slider.evaluate('e=>{e.value="30";e.dispatchEvent(new Event("input",{bubbles:true,composed:true}));}')
        outlier_text = page.locator('[data-live="outlier"]').inner_text()
        check('outlier arithmetic at 30: mean 8.80 median 4.00', '8.80' in outlier_text and '4.00' in outlier_text, outlier_text)
        page.locator('button[data-action="zoom"]').first.click()
        check('zoom dialog opens', page.locator('dialog').evaluate('d=>d.open'))
        page.keyboard.press('Escape')
        check('Escape closes zoom dialog', not page.locator('dialog').evaluate('d=>d.open'))
        with page.expect_download() as download_info:
            page.locator('button[data-action="download"]').first.click()
        download = download_info.value
        check('SVG download name', download.suggested_filename == 'research-week-11-figure-1.svg', download.suggested_filename)

        page.evaluate('location.hash="chapter-12"')
        page.wait_for_function('document.querySelector("research-chapter-visuals").getAttribute("chapter")==="12"')
        page.locator('input[data-control="sample"]').evaluate('e=>{e.value="100";e.dispatchEvent(new Event("input",{bubbles:true,composed:true}));}')
        sample_text = page.locator('[data-live="sample"]').inner_text()
        check('sampling arithmetic n100 SE1.00', '100' in sample_text and '1.00' in sample_text, sample_text)

        page.evaluate('location.hash="chapter-14"')
        page.wait_for_function('document.querySelector("research-chapter-visuals").getAttribute("chapter")==="14"')
        regression = page.locator('button[data-control="regression"]')
        check('regression initially visible', regression.get_attribute('aria-pressed') == 'true')
        regression.click()
        check('regression can be hidden', regression.get_attribute('aria-pressed') == 'false')
        regression.click()
        check('regression can be shown', regression.get_attribute('aria-pressed') == 'true')

        page.locator('#all').click()
        check('expand all chapters', page.locator('research-chapter-visuals').count() == 18)
        check('expand all diagrams', page.locator('research-chapter-visuals .canvas svg').count() == 36)
        page.locator('#all').click()
        check('return to one chapter', page.locator('research-chapter-visuals').count() == 1)
        page.set_viewport_size({'width': 375, 'height': 844})
        page.locator('#menu').click()
        check('mobile menu opens', page.locator('#menu').get_attribute('aria-expanded') == 'true')
        page.locator('#nav a[data-chapter="18"]').click()
        page.wait_for_function('document.querySelector("research-chapter-visuals").getAttribute("chapter")==="18"')
        check('mobile nav selects chapter18 and closes', page.locator('#menu').get_attribute('aria-expanded') == 'false')

        offline_page = context.new_page()
        offline_errors = []
        offline_requests = []
        offline_page.on('pageerror', lambda error: offline_errors.append(str(error)))
        offline_page.on('request', lambda request: offline_requests.append(request.url))
        offline_page.goto(offline.as_uri())
        offline_page.wait_for_selector('research-chapter-visuals .card')
        check('single-file offline page renders', offline_page.locator('research-chapter-visuals .canvas svg').count() == 2)
        check('single-file page has no network requests', not any(u.startswith(('http:', 'https:')) for u in offline_requests), offline_requests)
        check('no JavaScript exceptions', not js_errors and not offline_errors, js_errors + offline_errors)
        browser.close()
except Exception as exc:
    report['errors'].append({'exception': type(exc).__name__, 'detail': str(exc)})
finally:
    report['passed'] = not report['errors']
    report['checks_count'] = len(report['checks'])
    report['warning_count'] = len(report['warnings'])
    (OUT / 'qa-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))

raise SystemExit(0 if report['passed'] else 1)
