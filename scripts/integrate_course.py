"""Build the integrated course from the owner's verified public client assets.

No submissions, answers, comments, teacher sessions, secrets or font binaries are
fetched. Existing records remain on the original service; read-only course content
and diagrams become a single first-party reader. Run on the integration branch.
"""
from __future__ import annotations
from pathlib import Path
from urllib.parse import urljoin,urlparse
from urllib.request import Request,urlopen
from datetime import datetime,timezone
import csv,hashlib,io,json,re,subprocess

ROOT=Path(__file__).resolve().parents[1]
COURSE=ROOT/'course'
VENDOR=COURSE/'vendor'
VENDOR.mkdir(parents=True,exist_ok=True)
ORIGIN='https://research-methods-18.e5060b85-02c2-4336-b68d-483091a94ab8.chatgpt.site'
BASE=ORIGIN+'/_next/static/chunks/'
PINS={'course-iwkjHcS-.js':'d80454c15208f5cdc74c2a71680f0826e1890409873f6feb1c96e166460e99f9','lesson-DIhAjWhw.js':'762242350766864700308ecc62bdb2147c0917ba45a46929d1109f0a176b3cda','framework-D_rUT4EX.js':'939d0fabebb3b2f01753bb866b067d8d3384fb06da19f0e6557609d3b1a9f4f7'}
manifest={'version':'2.0.0','source':ORIGIN+'/course','retrieved_at':datetime.now(timezone.utc).isoformat(),'assets':[],'scope':'Original public lessons, original teaching interactions and 36 diagram designs. Formal submissions/discussions remain on the original service.','private_data_copied':False,'font_files_copied':False}

def get(url):
    req=Request(url,headers={'User-Agent':'ResearchMethodsOwnedCourseIntegration/2.0'})
    with urlopen(req,timeout=45) as r:
        assert r.status==200,url
        return r.read()

def sha(b):return hashlib.sha256(b).hexdigest()

def once(text,old,new):
    assert text.count(old)==1,('Source anchor changed',old,text.count(old))
    return text.replace(old,new,1)

pending=list(PINS);seen=set()
while pending:
    name=pending.pop()
    if name in seen:continue
    assert re.fullmatch(r'[A-Za-z0-9_-]+\.js',name),name
    data=get(BASE+name);assert len(data)<1000000
    if name in PINS:assert sha(data)==PINS[name],f'Review the changed original asset first: {name}'
    text=data.decode('utf-8');(VENDOR/name).write_bytes(data)
    seen.add(name);manifest['assets'].append({'url':BASE+name,'path':'course/vendor/'+name,'source_sha256':sha(data),'sha256':sha(data),'unmodified':True})
    for dep in re.findall(r'from\s*["\x27]([^"\x27]+)["\x27]',text):
        assert dep.startswith('./') and '/' not in dep[2:],dep
        pending.append(dep[2:])
# The reviewed data-only ESM export contains every original public chapter field.
result=subprocess.run(['node','--input-type=module','-e',"import * as c from './course/vendor/course-iwkjHcS-.js';console.log(JSON.stringify({units:c.a,stages:c.i,stageRanges:c.r,rhythm:c.t,sources:c.n}));"],cwd=ROOT,check=True,capture_output=True,text=True)
curriculum=json.loads(result.stdout)
assert len(curriculum['units'])==18
assert [u['week'] for u in curriculum['units']]==list(range(1,19))
assert all(len(u['sections'])==3 and u['teacher'] and u['prework'] and u['table'] for u in curriculum['units'])
(COURSE/'curriculum.json').write_text(json.dumps(curriculum,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest['original_chapters']=18;manifest['original_concept_sections']=sum(len(u['sections']) for u in curriculum['units'])
manifest['curriculum_sha256']=sha((COURSE/'curriculum.json').read_bytes())
# Preserve the 40-record explicitly synthetic teaching dataset.
csv_bytes=get(ORIGIN+'/data/simulated-service.csv')
rows=list(csv.reader(io.StringIO(csv_bytes.decode('utf-8-sig'))));assert len(rows)==41
(COURSE/'data').mkdir(exist_ok=True)
(COURSE/'data/simulated-service.csv').write_bytes(csv_bytes)
manifest['simulation_csv']={'source':ORIGIN+'/data/simulated-service.csv','rows':40,'sha256':sha(csv_bytes)}

# Single-figure rendering lets diagrams live at the relevant point in each lesson.
# The existing standalone visual gallery remains unchanged.
v=(ROOT/'visuals/chapter-visuals.js').read_text()
v=once(v,"static get observedAttributes(){return ['chapter'];}","static get observedAttributes(){return ['chapter','figure'];}")
v=once(v,'chapter.figures.map((f,i)=>{const v=this.makeFigure(i);','chapter.figures.map((f,i)=>{if(this.hasAttribute("figure")&&Number(this.getAttribute("figure"))!==i+1)return "";const v=this.makeFigure(i);')
v=once(v,'const CSS=`','const CSS=`\n:host([compact]) .head,:host([compact]) .credit{display:none!important}:host([compact]) .card{box-shadow:none}:host([compact]) .cards{gap:0}\n')
(COURSE/'diagrams.js').write_text(v,encoding='utf-8')
# Original week 2 is DATA TYPES, not question formulation. Relocate the funnel to
# week 1 and reuse the chart-selector in weeks 2/10. All 36 unique designs remain.
mapping={str(w):[[w,1],[w,2]] for w in range(1,19)}
mapping['1']=[[1,1],[1,2],[2,1]]
mapping['2']=[[2,2],[10,2]]
manifest['diagram_mapping']=mapping
manifest['unique_diagram_designs']=len({tuple(x) for rows in mapping.values() for x in rows})
assert manifest['unique_diagram_designs']==36

lesson_path=VENDOR/'lesson-DIhAjWhw.js'
lesson=lesson_path.read_text()
start=lesson.index('function sn(');end=lesson.index('function cn(',start)
# Do not expose a non-working local comment form, iframe, or imitation database.
service='''function sn({week:e,prompt:n}){return(0,I.jsxs)(`section`,{className:`panel integrated-service`,children:[(0,I.jsx)(`span`,{className:`section-kicker`,children:`本週一起討論`}),(0,I.jsx)(`h2`,{children:n}),(0,I.jsx)(`p`,{children:`教材與圖解已在本站整合。留言、回覆與教師管理仍由原課程系統保存；請在原課程視窗發言，以保留正確的瀏覽器身分與既有紀錄。`}),(0,I.jsx)(`a`,{className:`button primary`,href:`ORIGIN/course?week=`+e+`&tab=discussion`,target:`_blank`,rel:`noopener noreferrer`,children:`開啟本週討論（原課程）`}),(0,I.jsx)(`p`,{className:`caption`,children:`不需要 ChatGPT 帳號。本站不會假裝已送出留言，也不會另建一份不同步的討論資料。`})]})}'''.replace('ORIGIN',ORIGIN)
lesson=lesson[:start]+service+lesson[end:]
helper='''function IntegratedFigure({week,slot}){let source=week===1?[[1,1],[1,2],[2,1]][slot]:week===2?[[2,2],[10,2]][slot]:slot<2?[week,slot+1]:null;if(!source)return null;return(0,I.jsxs)(`section`,{className:`integrated-figure-slot`,id:`figure-`+(slot+1),"data-diagram-source":source.join(`.`),children:[(0,I.jsx)(`p`,{className:`section-kicker`,children:slot===2?`延伸圖解 · 將問題收斂`:`圖解導讀 · `+(slot===0?`釐清概念`:`案例與應用`)}),(0,I.jsx)(`research-chapter-visuals`,{chapter:String(source[0]),figure:String(source[1]),compact:``})]})}function IntegratedServiceNote(){return(0,I.jsx)(`p`,{className:`integrated-service-note`,children:`正式交卷與評分仍由原課程系統處理；下方按鈕會開啟原課程視窗。本頁不建立另一份成績紀錄。`})}'''
lesson=once(lesson,'function un({unit:e,displayName:t,initialTab:n})',helper+'function un({unit:e,displayName:t,initialTab:n})')
lesson=once(lesson,'(0,I.jsx)(`div`,{className:`flow-diagram`','(0,I.jsx)(IntegratedFigure,{week:e.week,slot:0}),(0,I.jsx)(`div`,{className:`flow-diagram`')
lesson=once(lesson,'(0,I.jsxs)(`section`,{className:`activity-block`','(0,I.jsx)(IntegratedFigure,{week:e.week,slot:1}),(0,I.jsxs)(`section`,{className:`activity-block`')
lesson=once(lesson,'(0,I.jsxs)(`section`,{className:`content-section source-section`','(0,I.jsx)(IntegratedFigure,{week:e.week,slot:2}),(0,I.jsxs)(`section`,{className:`content-section source-section`')
lesson=once(lesson,'(0,I.jsx)(`p`,{className:`note`,children:`此為形成性學習評量','(0,I.jsx)(IntegratedServiceNote,{}),(0,I.jsx)(`p`,{className:`note`,children:`此為形成性學習評量')
# Navigation is relative to /research_methods/course/, never /course at the domain root.
lesson=lesson.replace('`/course?week=`','`?week=`').replace('href:`/syllabus`','href:`?view=overview`')
lesson=lesson.replace('href:`/data/simulated-service.csv`','href:`./data/simulated-service.csv`')
lesson=lesson.replace('href:`/assessment/`','target:`_blank`,rel:`noopener noreferrer`,title:`在原課程系統交卷與保存紀錄`,href:`'+ORIGIN+'/assessment/`')
for route in ['progress','teacher']:
    lesson=lesson.replace('href:`/'+route+'`','target:`_blank`,rel:`noopener noreferrer`,title:`在原課程系統開啟`,href:`'+ORIGIN+'/'+route+'`')
lesson=lesson.replace('children:`開始本週評量 `','children:`開始本週評量（原課程） `').replace('children:[`開始評量`,','children:[`開始評量（原課程）`,')
assert '/api/comments' not in lesson
lesson_path.write_text(lesson,encoding='utf-8')
for item in manifest['assets']:
    if item['path'].endswith('/lesson-DIhAjWhw.js'):
        item['sha256']=sha(lesson_path.read_bytes());item['unmodified']=False;item['changes']='Inline figure slots; same-origin lesson links; clear original-service links; remove local comment-write UI.'
# Keep all original homepage art, typography and placement. Change destinations only.
from bs4 import BeautifulSoup
home_path=ROOT/'index.html';home=BeautifulSoup(home_path.read_text(),'html.parser')
home.select_one('.modern-gate')['href']='./course/'
home.select_one('.modern-gate')['aria-label']='進入研究方法18週整合課程：原教材與章節圖解'
link=home.select_one('.origin-course')
if link:link['href']='./course/';link['title']='整合課程；正式留言與評量依頁內說明於原系統開啟'
home_path.write_text(str(home)+'\n',encoding='utf-8')
home_manifest_path=ROOT/'assets/original-homepage/source-manifest.json'
hm=json.loads(home_manifest_path.read_text());hm['homepage_sha256']=sha(home_path.read_bytes());hm['modern_destination']='./course/'
home_manifest_path.write_text(json.dumps(hm,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest['homepage_sha256']=hm['homepage_sha256']
# Update existing regression assertions for the deliberately changed destination.
tests_path=ROOT/'tests/check_homepage.py';tests=tests_path.read_text()
tests=tests.replace("'-modern-visuals-link'","'-modern-integrated-link'").replace("== './visuals/'","== './course/'").replace("=='./visuals/'","=='./course/'")
tests=tests.replace("('.origin-course','course')","('.origin-course',None)")
tests=tests.replace("prefix+'-original-link-'+path,page.locator(selector).get_attribute('href')==SOURCE+path","prefix+'-service-link-'+str(path),page.locator(selector).get_attribute('href')==(SOURCE+path if path else './course/')")
tests=tests.replace("'/visuals/' in page.url and page.locator('#nav a').count()==18","'/course/' in page.url and page.locator('#course-nav a[data-week]').count()==18")
tests=tests.replace("page.locator('research-chapter-visuals .card').count()==2","page.locator('research-chapter-visuals .card').count()==3")
tests_path.write_text(tests,encoding='utf-8')
(COURSE/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'docs/integrated-course.md').write_text('''# 原課程與18章圖解整合 v2.0

入口：`/course/`。古今首頁右側已連到此頁；首頁圖案與原始8個背景檔未變。

## 已同站整合

原課程18週、54個概念段落、18組預習、案例、比較表、工作坊、學習目標、課末短答、每週成果、教師備課、120分鐘教學流程、來源、原有互動示例及40筆模擬CSV。保留原公開資料欄位與原教學元件，沒有用摘要取代全文。

原36組圖解均保留，直接插在原課程的概念與案例段落中，不是兩個外部頁面或iframe。第2週以原課程「變項、資料型態與圖表判讀」為準：問題收斂漏斗移到第1週，圖表選擇圖於第2／10週共用。每週至少2張，第1週3張；37次圖解呈現、36個獨立設計。

## 尚未後台合一

正式評量交卷、答案揭露、留言、教師評閱及個人學習紀錄繼續由原課程主機與資料庫負責。相應按鈕清楚標示「原課程」，在新視窗開啟；不仿造送出成功，不將草稿當成正式成績，不複製私人資料，也不將原站塞進可能無法傳遞身分Cookie的iframe。

要將所有資料操作也留在同一網址，仍需要可寫入的原課程後端原始碼、資料庫遷移／共用方案及後端部署權限；GitHub Pages本身只有靜態託管能力。

## 來源與維護

`course/curriculum.json` 是完整原公開教材的結構化副本；`course/source-manifest.json` 保存原始與整合後雜湊、時間、來源、對應表。`course/vendor/` 保留已在原站公開的教學元件及其瀏覽器依賴；元件變更僅限插圖位置、導覽與互動服務入口。沒有下載或提供字型檔。

原36張圖的獨立版本仍在 `visuals/`，其檔案未改寫。更新原課程時應先覆核版本，再執行匯入與完整檢查，不任意重新生成原教材。
''',encoding='utf-8')
readme=ROOT/'README.md';s=readme.read_text();heading='## 整合課程 v2.0'
if heading not in s:
    paragraph='''## 整合課程 v2.0

**[開啟原教材＋章節圖解整合版](https://panpanhuang332.github.io/research_methods/course/)**

首頁右側「進入」已連到整合課程。原18週全文、教師備課、原互動示例與36組圖解已同頁呈現；正式交卷、留言、評分與個人紀錄仍於原課程系統處理，並非後端或資料庫已合併。[內容與功能邊界](docs/integrated-course.md)。

'''
    s=s.replace('## 首頁圖案：',paragraph+'## 首頁圖案：',1)
    s=s.replace('現代入口進入本站圖解教材，學習紀錄與教師管理連回原課程。','現代入口進入本站整合課程，學習紀錄與教師管理連回原課程。')
    readme.write_text(s,encoding='utf-8')
print(json.dumps({'original_chapters':18,'original_sections':manifest['original_concept_sections'],'unique_diagrams':36,'rendered_diagram_occurrences':sum(map(len,mapping.values())),'student_records_copied':False},ensure_ascii=False))
