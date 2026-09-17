"""Retain the original typeface families without copying or distributing font files.

The original site's WOFF endpoints reject cross-origin font use. Use the same
LXGW WenKai TC and Noto Serif TC families through Google Fonts instead. Only CSS
is fetched; browser font requests go directly to the public font CDN.
"""
from pathlib import Path
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/'assets/original-homepage'
manifest=json.loads((DIR/'source-manifest.json').read_text())
soup=BeautifulSoup((ROOT/'index.html').read_text(),'html.parser')
text=''.join(sorted(set(soup.select_one('.joint-portal').get_text())))
requests=[('LXGW WenKai TC','Portal Brush','青燈四峰錄'),('Noto Serif TC:wght@400;600','Portal Serif',text)]
css_blocks=[];metadata=[]
for family,alias,chars in requests:
    url='https://fonts.googleapis.com/css2?'+urlencode({'family':family,'text':chars,'display':'swap'})
    req=Request(url,headers={'User-Agent':'Mozilla/5.0 AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36'})
    with urlopen(req,timeout=30) as response:
        assert response.status==200
        sheet=response.read().decode('utf-8')
    assert '@font-face' in sheet and family.split(':')[0] in sheet,'Unexpected font stylesheet.'
    for target in re.findall(r'url\(([^)]+)\)',sheet):
        assert urlparse(target.strip('\"\'')).netloc=='fonts.gstatic.com','Unexpected font provider.'
    sheet=re.sub(r'font-family:\s*[^;]+;',f'font-family: "{alias}";',sheet)
    if alias=='Portal Serif':sheet=re.sub(r'font-weight:\s*600\s*;','font-weight: 600 800;',sheet)
    css_blocks.append(sheet)
    metadata.append({'family':family,'alias':alias,'stylesheet_url':url,'css_sha256':hashlib.sha256(sheet.encode()).hexdigest()})
css_path=DIR/'portal.css'
css=css_path.read_text()
css=re.sub(r'@font-face\s*\{[^}]*\}','',css)
css+='\n/* Original typefaces through a CORS-enabled public service; no font binaries copied. */\n'+'\n'.join(css_blocks)
css_path.write_text(css,encoding='utf-8')
manifest['stylesheet']['sha256']=hashlib.sha256(css.encode()).hexdigest()
manifest['font_source_strategy']='Same original typeface families via Google Fonts CSS and direct public CDN requests; no font files copied.'
manifest['font_stylesheets']=metadata
(DIR/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
doc=ROOT/'docs/homepage-source.md'
body=doc.read_text()
body=body.replace('字型樣式引用原站公開字型URL；本儲存庫與附件不含字型檔。','原站字型端點限制跨來源載入，因此改由 Google Fonts 提供相同的 LXGW WenKai TC 與 Noto Serif TC 字型家族；僅保存字型樣式CSS，字型由瀏覽器直接向公開CDN請求。本儲存庫與附件不含字型檔。')
body=body.replace('36组','36組')
doc.write_text(body,encoding='utf-8')
print(json.dumps({'font_families':[x['family'] for x in metadata],'font_files_copied':False},ensure_ascii=False))
