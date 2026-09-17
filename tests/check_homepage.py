"""Verify the restored original homepage; never write to the production website."""
from __future__ import annotations
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import hashlib
import json
import os
import threading
import time
from urllib.request import Request, urlopen
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'homepage-qa'
OUT.mkdir(exist_ok=True)
BASE='https://panpanhuang332.github.io/research_methods/'
SOURCE='https://research-methods-18.e5060b85-02c2-4336-b68d-483091a94ab8.chatgpt.site/'
REPORT={'checks':[],'deployment_verified':False,'tested_commit':os.getenv('GITHUB_SHA','local'),'source':SOURCE,'font_diagnostics':{},'visual_comparison':{}}
VIEWPORTS=[(1440,900),(1024,900),(768,1024),(430,932),(390,844),(375,812),(320,667)]

def check(name,condition,detail=None):
    REPORT['checks'].append({'name':name,'passed':bool(condition),'detail':detail})
    if not condition:raise AssertionError(name+': '+str(detail))

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def git_blob(path):
    b=path.read_bytes()
    return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass

def inspect(page,label,url,manifest):
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    for width,height in VIEWPORTS:
        page.set_viewport_size({'width':width,'height':height})
        response=page.goto(url,wait_until='networkidle',timeout=60000)
        page.evaluate('document.fonts.ready')
        prefix=f'{label}-{width}'
        check(prefix+'-http',response is not None and response.status==200)
        check(prefix+'-title',page.title()=='研究方法18週學程｜服務與科技管理研究所')
        check(prefix+'-one-complete-scene',page.locator('picture.portal-scene').count()==1 and page.locator('.portal-scene img').count()==1)
        check(prefix+'-original-not-cropped-substitute',page.locator('.art,.worlds,.seam').count()==0)
        check(prefix+'-no-horizontal-overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        a=page.locator('.portal-ancient').bounding_box()
        b=page.locator('.portal-modern').bounding_box()
        check(prefix+'-ancient-left-modern-right',a['x']+a['width']<=b['x']+1)
        if width<=780:
            check(prefix+'-mobile-parallel',abs(a['y']-b['y'])<1 and abs(a['width']-b['width'])<1)
        image=page.locator('.portal-scene img').evaluate('(e)=>({src:e.currentSrc,w:e.naturalWidth,h:e.naturalHeight,complete:e.complete})')
        check(prefix+'-image-decodes',image['complete'] and image['w']>0,image)
        expected='portal-mobile-' if width<=780 else 'portal-desktop-'
        check(prefix+'-correct-source-image',expected in image['src'] and '/assets/original-homepage/' in image['src'],image['src'])
        check(prefix+'-no-sliced-backgrounds',page.locator('.portal-scene img').evaluate('(e)=>getComputedStyle(e).objectFit')=='cover')
        check(prefix+'-ancient-reserved',page.locator('.ancient-gate').is_disabled() and '尚未開放' in page.locator('#ancient-status').inner_text())
        check(prefix+'-modern-visuals-link',page.locator('.modern-gate').get_attribute('href')=='./visuals/')
        for selector,path in [('.joint-login','progress'),('.access-note a:not(.origin-course)','teacher'),('.origin-course','course')]:
            check(prefix+'-original-link-'+path,page.locator(selector).get_attribute('href')==SOURCE+path)
        if width<=780:
            for selector in ['.ancient-gate','.modern-gate','.joint-login']:
                box=page.locator(selector).bounding_box()
                check(prefix+'-visible-touch-target-'+selector,box['height']>=44 and box['y']+box['height']<=height+1,box)
        check(prefix+'-no-platform-login',page.locator('a,button').filter(has_text='ChatGPT').count()==0)
        check(prefix+'-no-application-scripts',page.locator('script,iframe').count()==0)
        screenshot=OUT/f'{prefix}.png'
        page.screenshot(path=str(screenshot),full_page=True)
        REPORT['font_diagnostics'][prefix]=page.evaluate('Array.from(document.fonts).filter(f=>f.family.includes("Portal")).map(f=>({family:f.family,status:f.status}))')
        source_image=OUT/f'source-{width}.png'
        if source_image.exists():
            left=Image.open(source_image).convert('RGB');right=Image.open(screenshot).convert('RGB')
            if left.size==right.size:
                diff=ImageChops.difference(left,right)
                REPORT['visual_comparison'][prefix]={'size':list(left.size),'mean_absolute_channel_difference':ImageStat.Stat(diff).mean,'identical':diff.getbbox() is None}
            else:REPORT['visual_comparison'][prefix]={'source_size':list(left.size),'restored_size':list(right.size)}
        geometry_file=OUT/f'source-{width}.json'
        if geometry_file.exists():
            old=json.loads(geometry_file.read_text())
            now=page.evaluate('''() => Object.fromEntries(['.joint-header','.portal-ancient','.portal-modern','#ancient-title','#modern-title','.ancient-gate','.modern-gate','.joint-login'].map(s=>{let r=document.querySelector(s).getBoundingClientRect();return[s,{x:r.x,y:r.y,width:r.width,height:r.height}]}))''')
            REPORT['visual_comparison'][prefix]['maximum_layout_delta']=max(abs(now[s][key]-values[key]) for s,values in old.items() for key in values)
    page.locator('.modern-gate').click()
    page.wait_for_selector('research-chapter-visuals',timeout=30000)
    check(label+'-modern-destination-works','/visuals/' in page.url and page.locator('#nav a').count()==18)
    check(label+'-chapter-rendered',page.locator('research-chapter-visuals .card').count()==2)
    check(label+'-no-javascript-errors',not errors,errors)

def live_matches(manifest):
    files=[('index.html',manifest['homepage_sha256']),('assets/original-homepage/portal.css',manifest['stylesheet']['sha256'])]+[(x['path'],x['sha256']) for x in manifest['images']]
    for path,expected in files:
        u=BASE+('' if path=='index.html' else path)+'?original-homepage='+REPORT['tested_commit'][:12]
        req=Request(u,headers={'User-Agent':'research-methods-homepage-verifier','Cache-Control':'no-cache'})
        with urlopen(req,timeout=25) as r:
            if r.status!=200 or hashlib.sha256(r.read()).hexdigest()!=expected:return False
    return True

def main():
    manifest=json.loads((ROOT/'assets/original-homepage/source-manifest.json').read_text())
    check('exact-source',manifest['source']==SOURCE)
    check('eight-unmodified-original-image-files',len(manifest['images'])==8 and all(x['unmodified'] for x in manifest['images']))
    for image in manifest['images']:check('image-sha256-'+Path(image['path']).name,digest(ROOT/image['path'])==image['sha256'])
    check('homepage-matches-manifest',digest(ROOT/'index.html')==manifest['homepage_sha256'])
    check('stylesheet-matches-manifest',digest(ROOT/'assets/original-homepage/portal.css')==manifest['stylesheet']['sha256'])
    check('reviewed-desktop-original',next(x['sha256'] for x in manifest['images'] if x['path'].endswith('portal-desktop-1536.avif'))=='14eee9d1b33f2373d6c6f368792ef096f0d094a046e3738429e5214d29258318')
    check('reviewed-mobile-original',next(x['sha256'] for x in manifest['images'] if x['path'].endswith('portal-mobile-480.avif'))=='1c24dba8bd307fec39c06b57946202de302b9033a122da34e7125a180ec78378')
    check('no-font-files-copied',not any(p.suffix.lower() in {'.woff','.woff2','.ttf','.otf','.eot'} for p in (ROOT/'assets').rglob('*')))
    check('old-cropped-background-removed',not (ROOT/'assets/portal-art.css').exists())
    check('all-36-diagrams-unchanged',git_blob(ROOT/'visuals/chapter-visuals.js')=='cb2cb78c875690792db66389e908eb1e43d900b8')
    check('visual-gallery-unchanged',git_blob(ROOT/'visuals/index.html')=='63639e61cf7a8101eee39c8677a10405931e07a0')
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch()
            inspect(browser.new_page(),'local',f'http://127.0.0.1:{server.server_address[1]}/',manifest)
            if os.getenv('CHECK_LIVE')=='1':
                end=time.monotonic()+360;reason='Awaiting exact deployed homepage and images'
                while time.monotonic()<end:
                    try:
                        if live_matches(manifest):REPORT['deployment_verified']=True;break
                    except Exception as e:reason=str(e)
                    time.sleep(10)
                check('live-homepage-css-all-images-match',REPORT['deployment_verified'],BASE if REPORT['deployment_verified'] else reason)
                inspect(browser.new_page(),'live',BASE+'?original-homepage='+REPORT['tested_commit'][:12],manifest)
            browser.close()
    finally:server.shutdown()
try:
    main();REPORT['status']='passed'
except Exception as e:
    REPORT['status']='failed';REPORT['error']=str(e);raise
finally:
    REPORT['passed']=sum(x['passed'] for x in REPORT['checks'])
    REPORT['total']=len(REPORT['checks'])
    (OUT/'report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:v for k,v in REPORT.items() if k!='checks'},ensure_ascii=False))
