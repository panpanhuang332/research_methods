"""Read-only browser verification for the integrated course, locally and on Pages."""
from __future__ import annotations
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request,urlopen
import hashlib,json,os,subprocess,threading,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-integration';OUT.mkdir(exist_ok=True)
ORIGIN='https://research-methods-18.e5060b85-02c2-4336-b68d-483091a94ab8.chatgpt.site'
PUBLIC='https://panpanhuang332.github.io/research_methods/'
REPORT={'checks':[],'source':ORIGIN+'/course','backend_migrated':False,'deployment_verified':False,'tested_commit':os.getenv('GITHUB_SHA','local')}
DATA=json.loads((ROOT/'course/curriculum.json').read_text())
MANIFEST=json.loads((ROOT/'course/source-manifest.json').read_text())

def check(name,condition,detail=None):
    REPORT['checks'].append({'name':name,'passed':bool(condition),'detail':detail})
    if not condition:raise AssertionError(name+': '+str(detail))

def normalize(s):return ' '.join(s.split())

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*a):pass

def inspect(browser,base,label,full=True):
    errors=[];writes=[];apis=[]
    context=browser.new_context(accept_downloads=True)
    def guard(route):
        r=route.request
        if r.method not in ['GET','HEAD','OPTIONS']:
            writes.append(r.url);route.abort()
        elif '/api/' in r.url:
            apis.append(r.url);route.abort()
        else:route.continue_()
    context.route('**/*',guard)
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    viewports=[(1440,1000),(375,812),(320,740)] if full else [(1440,1000),(375,812)]
    weeks=range(1,19) if full else [1,2,6,8,11,12,14,18]
    for width,height in viewports:
        page.set_viewport_size({'width':width,'height':height})
        for week in weeks:
            u=DATA['units'][week-1];prefix=f'{label}-{width}-week-{week}'
            r=page.goto(base+f'course/?week={week}',wait_until='networkidle',timeout=60000)
            page.wait_for_selector('.lesson-main h1',timeout=20000)
            check(prefix+'-http',r is not None and r.status==200)
            check(prefix+'-original-title',page.locator('.lesson-heading h1').inner_text()==u['title'])
            check(prefix+'-original-core',page.locator('.core-banner h2').inner_text()==u['core'])
            check(prefix+'-original-54-concepts',list(map(normalize,page.locator('.concept-text>p').all_inner_texts()))==[normalize(x[1]) for x in u['sections']])
            check(prefix+'-prework-preserved',list(map(normalize,page.locator('.prework-list li').all_inner_texts()))==list(map(normalize,u['prework'])))
            check(prefix+'-case-preserved',normalize(page.locator('.case-block p').inner_text())==normalize(u['caseText']))
            check(prefix+'-activity-preserved',normalize(page.locator('.activity-block>p').inner_text())==normalize(u['activity']))
            check(prefix+'-deliverable-preserved',normalize(page.locator('.deliverable p').inner_text())==normalize(u['deliverable']))
            expected=['.'.join(map(str,a)) for a in MANIFEST['diagram_mapping'][str(week)]]
            observed=page.locator('.integrated-figure-slot').evaluate_all('(es)=>es.map(e=>e.dataset.diagramSource)')
            check(prefix+'-semantic-diagram-map',observed==expected,observed)
            check(prefix+'-diagrams-rendered',page.locator('research-chapter-visuals .card').count()==len(expected))
            check(prefix+'-diagrams-inline',page.locator('.lesson-article .integrated-figure-slot').count()==len(expected))
            check(prefix+'-not-an-iframe',page.locator('iframe').count()==0)
            check(prefix+'-no-overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'))
            check(prefix+'-one-navigation',page.locator('#course-nav a[data-week]').count()==18)
            assessment=page.locator('.lesson-cta a')
            check(prefix+'-real-assessment-preserved',assessment.get_attribute('href')==ORIGIN+f'/assessment/{week}' and assessment.get_attribute('target')=='_blank')
            # Instructor content is preserved, not replaced by an outline or a link.
            page.get_by_role('tab',name='教師備課').click()
            check(prefix+'-teacher-notes-preserved',list(map(normalize,page.locator('.teacher-guide ol li').all_inner_texts()))==list(map(normalize,u['teacher'])))
            check(prefix+'-teacher-timetable',page.locator('.teacher-guide tbody tr').count()==7)
            check(prefix+'-same-site-tab-path','/course/' in page.url and 'tab=teacher' in page.url)
            page.get_by_role('tab',name='學習內容').click()
            if (full and width in [1440,375] and week in [1,2,11,14]) or (not full and week==1):
                page.screenshot(path=str(OUT/f'{prefix}.png'),full_page=True)
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(base+'course/?week=1',wait_until='networkidle')
    page.get_by_role('tab',name='師生討論').click()
    check(label+'-discussion-honest',page.locator('.integrated-service').count()==1 and page.locator('.integrated-service form').count()==0)
    check(label+'-discussion-correct-week',page.locator('.integrated-service a').get_attribute('href')==ORIGIN+'/course?week=1&tab=discussion')
    page.get_by_role('tab',name='章節評量').click()
    check(label+'-backend-notice',page.locator('.integrated-service-note').count()==1)
    # Navigate without leaving the project subpath.
    page.goto(base+'course/?week=11',wait_until='networkidle')
    native=page.locator('.concept-lab [role=slider]')
    check(label+'-original-interactive-retained',native.count()==1)
    before=page.locator('.concept-lab').inner_text();native.press('End')
    check(label+'-original-interactive-works',page.locator('.concept-lab').inner_text()!=before)
    slider=page.locator('research-chapter-visuals input[data-control=outlier]')
    slider.evaluate('(el)=>{el.value="30";el.dispatchEvent(new Event("input",{bubbles:true,composed:true}));}')
    check(label+'-new-interactive-works','8.80' in page.locator('research-chapter-visuals [data-live=outlier]').inner_text())
    page.locator('research-chapter-visuals button[data-action=zoom]').first.click()
    check(label+'-zoom',page.locator('research-chapter-visuals dialog[open]').count()==1)
    page.keyboard.press('Escape')
    check(label+'-zoom-close',page.locator('research-chapter-visuals dialog[open]').count()==0)
    with page.expect_download() as d:
        page.locator('research-chapter-visuals button[data-action=download]').first.click()
    download=d.value;download.save_as(str(OUT/f'{label}-example.svg'))
    check(label+'-svg-download',download.suggested_filename.endswith('.svg'))
    # Search the original content and restore the full menu.
    page.locator('#course-search').fill('逐字稿')
    check(label+'-content-search',0<page.locator('#course-nav a[data-week]').count()<18)
    page.locator('#course-search').fill('zzzz_no_matching_topic')
    check(label+'-search-empty-state','0 個章節' in page.locator('#search-status').inner_text())
    page.locator('#course-search').fill('')
    check(label+'-search-reset',page.locator('#course-nav a[data-week]').count()==18)
    page.goto(base+'course/?view=overview',wait_until='networkidle')
    check(label+'-overview-18',page.locator('.overview-card').count()==18)
    page.locator('.overview-card').nth(1).click()
    page.wait_for_selector('.lesson-main')
    check(label+'-overview-to-original-week2',page.locator('.lesson-heading h1').inner_text()==DATA['units'][1]['title'])
    page.set_viewport_size({'width':375,'height':812})
    page.locator('#open-menu').click()
    check(label+'-mobile-menu',page.locator('#open-menu').get_attribute('aria-expanded')=='true')
    page.keyboard.press('Escape')
    check(label+'-mobile-menu-close',page.locator('#open-menu').get_attribute('aria-expanded')=='false')
    r=page.goto(base,wait_until='networkidle')
    check(label+'-homepage-art-preserved',page.locator('picture.portal-scene').count()==1)
    check(label+'-right-entry',page.locator('.modern-gate').get_attribute('href')=='./course/')
    page.locator('.modern-gate').click();page.wait_for_selector('.lesson-main')
    check(label+'-entry-opens-integrated-course','/course/' in page.url and page.locator('research-chapter-visuals .card').count()==3)
    check(label+'-no-runtime-errors',not errors,errors)
    check(label+'-no-unintended-writes',not writes,writes)
    check(label+'-no-broken-local-api-calls',not apis,apis)
    context.close()

def live_matches():
    paths=['index.html','course/index.html','course/app.js','course/course.css','course/diagrams.js','course/source-manifest.json','course/vendor/lesson-DIhAjWhw.js']
    for path in paths:
        req=Request(PUBLIC+path+'?integrated='+REPORT['tested_commit'][:12],headers={'User-Agent':'CourseIntegrationVerifier','Cache-Control':'no-cache'})
        with urlopen(req,timeout=20) as r:
            if r.status!=200 or hashlib.sha256(r.read()).digest()!=hashlib.sha256((ROOT/path).read_bytes()).digest():return False
    return True

def main():
    check('complete-original-data',len(DATA['units'])==18 and sum(len(u['sections']) for u in DATA['units'])==54)
    check('preserve-all-36-designs',len({tuple(a) for rows in MANIFEST['diagram_mapping'].values() for a in rows})==36)
    check('curriculum-integrity',hashlib.sha256((ROOT/'course/curriculum.json').read_bytes()).hexdigest()==MANIFEST['curriculum_sha256'])
    check('no-font-binaries',not any(p.suffix.lower() in {'.woff','.woff2','.ttf','.otf'} for p in (ROOT/'course').rglob('*')))
    for f in (ROOT/'course').rglob('*.js'):
        p=subprocess.run(['node','--check',str(f)],capture_output=True,text=True)
        check('syntax-'+f.name,p.returncode==0,p.stderr or None)
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch()
            inspect(browser,f'http://127.0.0.1:{server.server_address[1]}/','local',True)
            if os.getenv('CHECK_LIVE')=='1':
                end=time.monotonic()+360;reason='Awaiting exact deployment'
                while time.monotonic()<end:
                    try:
                        if live_matches():REPORT['deployment_verified']=True;break
                    except Exception as e:reason=str(e)
                    time.sleep(10)
                check('public-deployment-exact',REPORT['deployment_verified'],reason if not REPORT['deployment_verified'] else PUBLIC+'course/')
                inspect(browser,PUBLIC,'live',False)
            browser.close()
    finally:server.shutdown()

try:
    main();REPORT['status']='passed'
except Exception as e:
    REPORT['status']='failed';REPORT['error']=str(e);raise
finally:
    REPORT['passed']=sum(x['passed'] for x in REPORT['checks']);REPORT['total']=len(REPORT['checks'])
    (OUT/'report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in REPORT.items() if k!='checks'},ensure_ascii=False))
