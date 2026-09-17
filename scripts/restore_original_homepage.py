"""Restore only the public homepage the owner explicitly selected.

No source application scripts, fonts, sessions, records or databases are copied.
The build is deliberately pinned to the reviewed original stylesheet and images.
"""
from __future__ import annotations
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
import hashlib
import json
import re
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://research-methods-18.e5060b85-02c2-4336-b68d-483091a94ab8.chatgpt.site/'
ASSETS = ROOT / 'assets/original-homepage'
QA = ROOT / 'homepage-qa'
PINNED_CSS = '604e6bc83e055a7b666b3a24081e5df7eb6e8ac54b23c9db3214ae8453f9e377'
PINNED_IMAGES = {
    'portal-desktop-1536.avif': '14eee9d1b33f2373d6c6f368792ef096f0d094a046e3738429e5214d29258318',
    'portal-mobile-480.avif': '1c24dba8bd307fec39c06b57946202de302b9033a122da34e7125a180ec78378',
}
EXPECTED = {f'portal-{kind}-{width}.{ext}' for kind, widths in [('desktop',[1280,1536]),('mobile',[480,768])] for width in widths for ext in ['avif','webp']}
ASSETS.mkdir(parents=True, exist_ok=True)
QA.mkdir(exist_ok=True)
manifest = {'source':SOURCE,'retrieved_at':datetime.now(timezone.utc).isoformat(),'images':[], 'fonts_copied':False, 'application_scripts_copied':False}

with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context(viewport={'width':1440,'height':900})
    page=context.new_page()
    response=page.goto(SOURCE,wait_until='networkidle',timeout=60000)
    assert response is not None and response.status==200, 'Original source must be publicly readable.'
    assert page.title()=='研究方法18週學程｜服務與科技管理研究所', 'Unexpected source homepage.'
    page.evaluate('document.fonts.ready')
    source_html=page.content()
    soup=BeautifulSoup(source_html,'html.parser')
    portal=soup.select_one('main.joint-portal')
    assert portal and portal.select_one('.portal-scene picture') is None
    assert portal.select_one('.portal-scene img') and portal.select_one('.portal-modern .modern-gate')
    assert '青燈四峰錄' in ''.join(portal.select_one('#ancient-title').stripped_strings)
    styles=soup.select('link[rel="stylesheet"]')
    assert len(styles)==1, 'Reviewed source had exactly one stylesheet.'
    css_url=urljoin(SOURCE,styles[0]['href'])
    assert urlparse(css_url).netloc==urlparse(SOURCE).netloc
    css_response=context.request.get(css_url,timeout=30000)
    assert css_response.status==200
    css_bytes=css_response.body()
    assert hashlib.sha256(css_bytes).hexdigest()==PINNED_CSS, 'Original stylesheet changed; review it before importing.'
    css=css_bytes.decode('utf-8')
    # Fonts remain on the original host. No font binary is saved or distributed.
    def absolute_url(match):
        value=match.group(1).strip().strip('\"\'')
        if value.startswith(('data:','#')):return match.group(0)
        resolved=urljoin(SOURCE,value)
        assert urlparse(resolved).netloc==urlparse(SOURCE).netloc, 'Unexpected third-party CSS resource.'
        return 'url("'+resolved+'")'
    css=re.sub(r'url\(([^)]+)\)',absolute_url,css)
    css+='\n/* Same original appearance; the extra original-course link does not alter its typography. */\n.access-note .origin-course{text-decoration:none}\n'
    (ASSETS/'portal.css').write_text(css,encoding='utf-8')
    manifest['stylesheet']={'source_url':css_url,'source_sha256':PINNED_CSS,'path':'assets/original-homepage/portal.css','sha256':hashlib.sha256(css.encode()).hexdigest()}
    images=set()
    for element in portal.select('picture source, picture img'):
        if element.get('src'):images.add(Path(urlparse(element['src']).path).name)
        if element.get('srcset'):
            images.update(Path(urlparse(part.strip().split()[0]).path).name for part in element['srcset'].split(','))
    assert images==EXPECTED, 'Do not guess, crop, regenerate, or substitute the source image set.'
    for name in sorted(images):
        url=urljoin(SOURCE,name)
        result=context.request.get(url,timeout=30000)
        assert result.status==200 and result.headers.get('content-type','').startswith('image/'), name
        content=result.body()
        assert 1000<len(content)<1000000, 'Unexpected image size: '+name
        digest=hashlib.sha256(content).hexdigest()
        if name in PINNED_IMAGES:assert digest==PINNED_IMAGES[name], 'Reviewed original image changed: '+name
        (ASSETS/name).write_bytes(content)
        manifest['images'].append({'source_url':url,'path':'assets/original-homepage/'+name,'size':len(content),'sha256':digest,'unmodified':True})
    for width,height in [(1440,900),(1024,900),(768,1024),(430,932),(390,844),(375,812),(320,667)]:
        page.set_viewport_size({'width':width,'height':height})
        page.wait_for_timeout(250)
        page.evaluate('document.fonts.ready')
        page.screenshot(path=str(QA/f'source-{width}.png'),full_page=True)
        geometry=page.evaluate('''() => {
          const selectors=['.joint-header','.portal-ancient','.portal-modern','#ancient-title','#modern-title','.ancient-gate','.modern-gate','.joint-login'];
          return Object.fromEntries(selectors.map(s=>{let r=document.querySelector(s).getBoundingClientRect();return [s,{x:r.x,y:r.y,width:r.width,height:r.height}]}));
        }''')
        (QA/f'source-{width}.json').write_text(json.dumps(geometry),encoding='utf-8')
    browser.close()

# Preserve the actual rendered portal rather than reproducing it from a screenshot.
for tag in list(portal.find_all(['script','iframe','object','embed','form'])):
    tag.decompose()
for tag in portal.find_all(True):
    for key in list(tag.attrs):
        if key.lower().startswith('on'):del tag[key]
for element in portal.select('picture source,picture img'):
    if element.get('src'):element['src']='./assets/original-homepage/'+Path(urlparse(element['src']).path).name
    if element.get('srcset'):
        element['srcset']=', '.join('./assets/original-homepage/'+Path(urlparse(part.strip().split()[0]).path).name+' '+part.strip().split()[1] for part in element['srcset'].split(','))
for link in portal.select('a[href]'):
    href=link['href']
    if href=='/':link['href']='./'
    elif href=='/course':
        link['href']='./visuals/'
        link['aria-label']='進入研究方法18週學程圖解教材（GitHub版）'
    elif href in ['/progress','/teacher']:
        link['href']=urljoin(SOURCE,href)
        link['title']='在原課程網站開啟；資料未移轉至 GitHub'
        link['rel']='noopener'
    else:assert href=='#modern-entry', 'Unreviewed navigation: '+href
note=portal.select_one('.access-note')
assert note
teacher=note.find('a').extract()
note.clear()
original_course=soup.new_tag('a',href=urljoin(SOURCE,'course'))
original_course['class']='origin-course'
original_course['title']='在原課程網站開啟完整教材、留言與評量'
original_course.string='免帳號留言與評量'
note.append(original_course)
note.append(' · ')
note.append(teacher)
html='''<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#101415">
<title>研究方法18週學程｜服務與科技管理研究所</title>
<meta name="description" content="研究方法古今聯合入口。首頁採用原站完整桌面與手機圖案；GitHub版提供18章36組圖解教材，完整課程及學習紀錄連回原課程網站。">
<link rel="stylesheet" href="./assets/original-homepage/portal.css">
</head>
<body>
<!-- Original public homepage visual presentation restored without application scripts or private data. -->
'''+str(portal)+'''
</body>
</html>
'''
(ROOT/'index.html').write_text(html,encoding='utf-8')
manifest['homepage_sha256']=hashlib.sha256(html.encode()).hexdigest()
(ASSETS/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
old=ROOT/'assets/portal-art.css'
if old.exists():old.unlink()
(ROOT/'docs').mkdir(exist_ok=True)
(ROOT/'docs/homepage-source.md').write_text('''# 原站首頁圖案更正

唯一視覺基準：'''+SOURCE+'''

已恢復原站 `.joint-portal` 首頁結構與樣式，並逐位元組保存原站實際引用的8個 AVIF/WebP 桌面／手機背景檔；不是將舊設計圖裁成兩張背景，也沒有重新生成圖片。手機仍使用原站的780px切換條件，古今兩側始終左右並列。

`assets/original-homepage/source-manifest.json` 記錄每個來源網址、檔案大小與 SHA-256。所有背景圖均在 GitHub 本地託管。首頁只含 HTML/CSS 與圖片，不需要原站 React 程式。原站字型樣式仍引用原站公開字型URL；本儲存庫與附件不包含字型檔。

導覽邊界：
- 現代「進入」維持前次 GitHub 版的 `./visuals/` 目的地。
- 「我的學習紀錄」、「教師管理」與底部「免帳號留言與評量」連回原課程網站的 `/progress`、`/teacher`、`/course`。連結有原站說明；沒有複製、讀取或移轉個人紀錄。
- 古代入口維持原站的停用按鈕與「入口預留 · 尚未開放」，未實作古代內容。
- 原36組圖解、作答、留言與資料庫沒有被修改。

這是首頁視覺更正，不是完整課程後端移轉。`tests/check_homepage.py` 驗證圖片雜湊、來源圖比較、七個桌面／手機尺寸、古今並列、圖片載入、現代入口及正式Pages部署。
''',encoding='utf-8')
readme=ROOT/'README.md'
text=readme.read_text(encoding='utf-8')
heading='## 首頁圖案：恢復指定原站版本'
if heading not in text:
    addition='''## 首頁圖案：恢復指定原站版本

[開啟古今聯合首頁](https://panpanhuang332.github.io/research_methods/) ／ [指定原站](SOURCE_URL)

首頁已恢復原站的完整桌面／手機背景與排版，不再使用裁切拼接的替代入口。 [圖片來源、校驗與導覽範圍](docs/homepage-source.md)。現代入口仍進入本站圖解教材，學習紀錄與教師管理連回原課程。

'''.replace('SOURCE_URL',SOURCE)
    text=text.replace('## 直接開啟18章圖解教材',addition+'## 直接開啟18章圖解教材',1)
    readme.write_text(text,encoding='utf-8')
print(json.dumps({'restored_images':len(manifest['images']),'source':SOURCE,'homepage_sha256':manifest['homepage_sha256'],'copied_fonts':False},ensure_ascii=False))
