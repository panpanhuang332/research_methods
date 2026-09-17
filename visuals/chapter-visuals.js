/* Research Methods · 18-week visual companion, v1.0.0
 * Self-contained, read-only Web Component. No login, cookies, storage or network requests.
 * Teaching examples are synthetic. Mount explicitly: <research-chapter-visuals chapter="1">.
 * This module does not replace the host course, routes, assessment or discussion system.
 */
(() => {
'use strict';
const TAG = 'research-chapter-visuals';
if (customElements.get(TAG)) return;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const refs = {
 research: ['Bhattacherjee · Social Science Research (2012)', 'https://digitalcommons.usf.edu/oa_textbooks/3/'],
 stats: ['OpenIntro Statistics · 資料、推論與迴歸', 'https://www.openintro.org/book/os/'],
 ci: ['NIST · Confidence Limits for the Mean', 'https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm'],
 zotero: ['Zotero · 官方入門指南', 'https://www.zotero.org/support/quick_start_guide'],
 diamond: ['Design Council · The Double Diamond（CC BY 4.0）', 'https://www.designcouncil.org.uk/resources/the-double-diamond/']
};
// All chapter titles map to the existing 18-week outline. The host remains the source of truth.
const chapters = [
 {title:'服務現象與研究', stage:'問題形成', question:'回覆更快，為什麼不一定更滿意？', figures:[
  ['research-cycle','從服務現象走向可檢查的解釋','研究路徑','觀察、問題、證據、解釋各有不同工作；新證據也可能讓你回頭修正問題。','不要把「我覺得」直接當成研究結論。',['research']],
  ['service-kpis','同一項服務，三種不同結果','指標比較','首次回覆時間、問題解決率、滿意度要分開讀；各指標使用自己的單位與刻度。','這是教學模擬，並無抽樣資訊或因果識別設計，不能判定真實 AI 客服成效。',['stats']]
 ]},
 {title:'把主題變成研究問題', stage:'問題形成', question:'如何把「我想研究 AI 客服」改成可執行的問題？', figures:[
  ['question-funnel','把大題目收斂成一句研究問題','收斂漏斗','依序交代場域、對象、結果與範圍；每縮小一次，資料需求就更明確。','問題越長不代表越精確。先確認你能取得對應資料。',['research']],
  ['question-evidence','問題不同，需要的證據也不同','對照地圖','描述、比較、關聯與理解經驗不是同一種任務。先選任務，再選資料。','相關問題不會因為換成迴歸分析，就自動變成因果問題。',['research','stats']]
 ]},
 {title:'文獻搜尋與來源查證', stage:'文獻與設計', question:'怎樣找到能回答問題、也查得到原文的文獻？', figures:[
  ['search-path','搜尋是一條可以回溯的路徑','檢索流程','同義詞用 OR 擴展，不同概念用 AND 組合；保留資料庫、日期、檢索式與篩選理由。','這是一般課程的搜尋紀錄，不冒稱已完成系統性文獻回顧。',['research','zotero']],
  ['source-trace','讓每一句主張都找得到出處','查證鏈','書目資料幫你定位文件，原文與頁碼才讓人檢查主張是否被支持。','找到 DOI 只代表能定位文獻，不等於文獻品質或主張已經獲得保證。',['research','zotero']]
 ]},
 {title:'文獻比較與概念架構', stage:'文獻與設計', question:'讀完幾篇文章，怎麼形成自己的研究架構？', figures:[
  ['literature-matrix','從逐篇摘要改成橫向比較','文獻矩陣','比較對象、設計、測量和限制；看見差異，才能提出有根據的待解問題。','表中的 A、B、C 是虛構教學條目，不是可放入論文的真實引用。',['research']],
  ['concept-map','概念架構是待檢驗的說明，不是結果','假設關係圖','箭頭表示你提出的方向；每條箭頭都需要理論理由、可測量的變項與合適的設計。','虛線是尚待檢驗的假設；畫出中介路徑不代表已證明中介效果。',['research']]
 ]},
 {title:'研究設計與抽樣', stage:'文獻與設計', question:'這個問題，要怎樣的資料與比較才答得出來？', figures:[
  ['design-tree','先問要回答什麼，再決定怎麼研究','設計決策圖','先定義問題任務，再確認資料型態、時間與比較方式；混合方法還要說明如何整合。','圖是入門導航，不是僅憑一個分支就決定完整研究設計。',['research']],
  ['sampling-frame','你想研究的人，不一定都進入了樣本','抽樣範圍圖','目標母體、抽樣框、受邀者、回覆者和分析樣本各有不同的邊界。','增加回覆數不會自動修補抽樣框遺漏與自願回覆偏差。',['stats']]
 ]},
 {title:'測量、題項與研究倫理', stage:'文獻與設計', question:'抽象概念如何變成可觀察、可負責任蒐集的資料？', figures:[
  ['measurement-chain','從構念到一個可回答的題項','測量鏈','先界定概念，再選擇面向與題項；記錄尺度與時間範圍，並做預試。','示範題項不是已驗證量表；單一題項不保證涵蓋整個構念。',['research']],
  ['ethics-gates','資料蒐集前，先走過四道關卡','倫理與資料流程','先向所屬機構確認適用的倫理程序與資料授權，再處理告知、最小蒐集與存取管理。','課堂圖解不是免審認定。去識別化也不等於資料絕對無法再識別。',['research']]
 ]},
 {title:'訪談與服務觀察', stage:'理解經驗', question:'除了問滿不滿意，還可以看見什麼？', figures:[
  ['service-blueprint','把看得見與看不見的服務過程放在一起','服務泳道圖','同一時間點，使用者行動、前台回應與後台處理可能不一致；落差就是追問入口。','流程為虛構案例，不表示每個客服組織都以這種方式運作。',['research']],
  ['interview-funnel','從開放敘事，追問到具體事件','訪談漏斗','先請對方說一段經驗，再問當時的行動與意思；用澄清取代暗示答案。','訪談不是引導受訪者替研究假設背書。原話與研究者解釋要分開。',['research']]
 ]},
 {title:'文本編碼與主題分析', stage:'理解經驗', question:'幾段話，如何變成有依據的分析？', figures:[
  ['coding-trace','從原話、編碼到分析主題','分析證據鏈','每一層都要能回到原始片段；主題不只是詞語的集合，而是有分析意義的模式。','以下是一般編碼教學示例，不宣稱同時符合所有主題分析取向。',['research']],
  ['case-matrix','跨個案比較，也要留下不符合的例子','個案比較矩陣','比較相同面向下的差異，保留反例，再回到上下文修正解釋。','提及次數最多的內容，不一定就是最重要的主題。',['research']]
 ]},
 {title:'期中研究設計門診', stage:'研究設計檢核', question:'目前的設計，真的能回答你寫下的問題嗎？', figures:[
  ['alignment-map','問題、資料、分析與結論要對得上','設計對齊圖','沿著同一列追問：資料是否存在？分析是否合適？最後最多能說到哪裡？','不應先選想用的統計軟體，再倒填研究問題。',['research']],
  ['design-clinic','同儕不是幫你加方法，而是找出斷點','修正回路','把一個重大斷點修好，比在計畫中堆疊更多方法更重要。','門診流程是本課程原創工作法，不是通用審查標準。',[]]
 ]},
 {title:'資料建檔與圖表', stage:'資料與統計', question:'資料進軟體之前，要先做哪些檢查？', figures:[
  ['data-cleaning','從原始資料到可分析資料，留下處理紀錄','資料處理圖','定義一列代表什麼，再核對型態、範圍、缺失與重複；原始檔保留不覆寫。','空白不一定是零；極端值也不能因為不順眼就直接刪除。',['stats']],
  ['chart-choice','圖表要跟著問題與資料型態走','圖表選擇圖','比較類別看長條，觀察數值分布看直方，兩數值關係看散點，時間順序看折線。','示意圖只教辨識用途；正式圖仍需單位、分母、樣本量與來源。',['stats']]
 ]},
 {title:'平均數、中位數與變異', stage:'資料與統計', question:'同一份資料，為什麼可以得到不同的「典型值」？', figures:[
  ['outlier-lab','移動一筆等待時間，觀察平均數與中位數','互動點圖','拖動滑桿改變最後一筆資料，觀察兩種中心位置如何反應。','示範不代表中位數永遠比平均數好，選擇仍取決於研究問題與分布。',['stats']],
  ['spread-comparison','平均相同，服務穩定度可以很不同','分布比較','兩組的平均等待時間都是 5 分鐘，但資料分散程度不同。','標準差描述資料變異；標準誤描述估計量的抽樣變異，兩者不能混用。',['stats']]
 ]},
 {title:'抽樣變異與不確定性', stage:'資料與統計', question:'拿到另一批樣本，估計值會不會改變？', figures:[
  ['sampling-lab','樣本變大，平均數的抽樣分布怎麼變？','互動抽樣分布','此模型假設獨立抽樣、母體常態、μ＝50、σ＝10；SE＝σ／√n。曲線面積均為 1。','精確度變高不等於偏差消失；圖中的母體條件是教學設定，不是實際研究的已知事實。',['stats','ci']],
  ['confidence-intervals','95% 是程序的長期涵蓋率，不是單次機率','區間示意','每條線是一批樣本算出的區間。以相同程序反覆抽樣，長期約 95% 的區間涵蓋固定真值。','已算出的某個頻率學派區間，不解讀成「真值有 95% 機率在裡面」。',['ci']]
 ]},
 {title:'兩組比較與前後測', stage:'資料與統計', question:'兩組不同的人，和同一群人的兩次測量，有何不同？', figures:[
  ['independent-paired','先判斷觀測值之間是否有配對關係','設計比較圖','不同人的兩組資料與同一人前後測，分析單位不同；後者先看每個人的差值。','本圖以數值結果為例；方法仍須檢查分布、獨立性、尺度與研究設計。',['stats']],
  ['paired-trajectories','不要讓平均變化掩蓋每個人的變化','配對軌跡圖','本例為 5 人、1–5 分評分，平均差為後測減前測；線條保留個人的配對關係。','前後有改變，不代表介入造成改變。沒有對照仍可能受到時間或其他事件影響。',['stats']]
 ]},
 {title:'相關、迴歸與因果界線', stage:'資料與統計', question:'一條向下的線，能不能證明等待造成不滿？', figures:[
  ['regression-lab','看見點、趨勢與偏離，不只看一個 r','互動散點圖','切換是否顯示最小平方法趨勢線；r、斜率與截距由目前這組模擬點實際計算。','線性關聯不等於因果，預測也不宜任意外推到觀察範圍之外。',['stats']],
  ['confounding-dag','第三個因素，可能同時影響兩個變項','混淆結構圖','複雜案件可能等得更久，也更難滿意；這是一種需要檢查的替代解釋。','這張圖是因果假設，不是已確認的因果證據。把變項全部丟進迴歸也不保證排除混淆。',['research','stats']]
 ]},
 {title:'服務設計與成效評估', stage:'整合與表達', question:'做出原型之後，怎樣知道它真的改善了服務？', figures:[
  ['double-diamond','把問題找對，再把方案做對','雙鑽石','先探索與界定問題，再發展與測試方案；實作中可反覆往返。','依 Design Council 雙鑽石概念重新繪製與中文化（CC BY 4.0），不是原圖複製。',['diamond']],
  ['evaluation-chain','產出一個功能，不等於產生一個成效','成效邏輯圖','將資源、活動、產出、結果分開，再為結果安排指標、比較方式與副作用檢查。','「功能完成」與「使用次數增加」不能單獨證明滿意度或服務品質改善。',['research']]
 ]},
 {title:'結果解讀與研究限制', stage:'整合與表達', question:'研究結果究竟支持什麼，又不支持什麼？', figures:[
  ['claim-boundary','把主張停在證據能支撐的位置','主張邊界圖','描述樣本、報告關聯、推論母體和提出因果說明，需要不同的證據條件。','這不是價值高低階梯。質性理解有自己的證據標準，不必把因果推論當唯一終點。',['research','stats']],
  ['reproducibility-map','讓別人看得懂，你如何走到這個結果','可追溯資料圖','原始資料、清理紀錄、分析步驟、圖表與版本彼此可對照；公開程度依授權與隱私決定。','可追溯不等於把含個資的原始資料全部公開。', ['research']]
 ]},
 {title:'研究計畫口頭答辯', stage:'整合與表達', question:'如何在短時間內，把研究設計說清楚？', figures:[
  ['defense-story','一場 8 分鐘示範報告的敘事配置','報告時間圖','先說問題與缺口，再花較多時間說資料和方法，最後交代限制與下一步。','8 分鐘只是練習配置；正式報告依授課教師或口試規定調整。',[]],
  ['answer-loop','遇到質疑，不急著回答「我再加一個分析」','答辯回應圖','先確認對方問的是什麼，再用證據回應，說明邊界，最後提出可執行的修正。','這是溝通練習，不以話術取代方法上的不足。',[]]
 ]},
 {title:'計畫修訂與研究起步', stage:'整合與表達', question:'把回饋變成能執行的下一版，而不是再存一個 final。', figures:[
  ['revision-loop','一條回饋，對應一個可查驗的修正','版本修訂圖','保留回饋、決策理由、修改位置與驗證結果，才能看見計畫如何改變。','不是每條建議都要照單全收，但接受或不接受都要能說明理由。',[]],
  ['launch-roadmap','從期末計畫走到第一次正式蒐集','執行關卡圖','先確認範圍、授權與倫理程序，再試行、修正工具及啟動正式蒐集；預試也需符合適用程序。','時程是示例，不代表任何機構的審查天數；核准尚未完成時，不以期限為由先收資料。',['research']]
 ]}
];

const SVG_STYLE = `text{font-family:system-ui,-apple-system,"Microsoft JhengHei","Noto Sans CJK TC",sans-serif;fill:#243c50;font-size:16px} .sm{font-size:13px;fill:#50667a}.xs{font-size:12px;fill:#50667a}.heading{font-size:19px;font-weight:700}.big{font-size:28px;font-weight:750}.light{fill:#fff}.blue{fill:#25466e}.gold{fill:#9b682b}.muted{fill:#50667a}.line{stroke:#8b9fb0;stroke-width:2;fill:none}.grid{stroke:#dce5eb;stroke-width:1;fill:none}.arrow{stroke:#587793;stroke-width:2;fill:none}.node{fill:#fff;stroke:#c8d7e2;stroke-width:1.5}.tint{fill:#edf3f8;stroke:#c8d7e2;stroke-width:1.5}.warm{fill:#faf3e7;stroke:#dfcaa8;stroke-width:1.5}.dark{fill:#25466e;stroke:#25466e}.dash{stroke-dasharray:6 5}.strong{font-weight:700}.mono{font-family:ui-monospace,monospace;white-space:pre;font-size:13px;fill:#50667a}.soft{fill:#edf3f8}.teal{fill:#237776}`;
let seq=0;
const tx=(x,y,s,cls='',anchor='start')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;
const rect=(x,y,w,h,cls='node',rx=12)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"/>`;
const line=(x1,y1,x2,y2,cls='line')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const node=(x,y,w,h,title,sub='',cls='node')=>rect(x,y,w,h,cls)+tx(x+w/2,y+(sub?30:h/2+6),title,`strong ${cls==='dark'?'light':''}`,'middle')+(sub?tx(x+w/2,y+54,sub,`sm ${cls==='dark'?'light':''}`,'middle'):'');
const circle=(x,y,r,fill='#25466e',stroke='none')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const sampleSD=a=>Math.sqrt(a.reduce((s,v)=>s+(v-mean(a))**2,0)/(a.length-1));
function svgFigure(type,title,desc,state={}) {
 const uid=`rmv-${++seq}`;
 const ar=(x1,y1,x2,y2,dash=false)=>`<path d="M${x1} ${y1}L${x2} ${y2}" class="arrow${dash?' dash':''}" marker-end="url(#${uid}-arrow)"/>`;
 const pathAr=(d,dash=false)=>`<path d="${d}" class="arrow${dash?' dash':''}" marker-end="url(#${uid}-arrow)"/>`;
 const flow=(items,y=100)=>{const gap=24,w=(720-gap*(items.length-1))/items.length;return items.map((s,i)=>node(20+i*(w+gap),y,w,80,s[0],s[1],i===items.length-1?'dark':'node')+(i<items.length-1?ar(20+i*(w+gap)+w+2,y+40,20+(i+1)*(w+gap)-4,y+40):'')).join('');};
 let g='',h=330,controls='',table='';
 switch(type){
 case 'research-cycle':
  g=flow([['觀察現象','回覆變快了'],['界定問題','滿意度改變了嗎？'],['蒐集證據','紀錄、問卷、訪談'],['提出解釋','檢查其他可能']]);
  g+=pathAr('M652 184 V230 H114 V185',true)+tx(380,260,'新證據 → 回頭檢查原來的問題與假設','sm','middle');break;
 case 'service-kpis': {
  h=390;
  const rows=[['首次回覆時間','分鐘',8,2,10],['問題解決率','%',72,74,100],['滿意度平均','分／5分',3.8,3.6,5]];
  g=rect(20,15,720,45,'tint')+tx(38,43,'各指標分開刻度 · 以下數值皆為教學模擬','sm');
  rows.forEach((r,i)=>{const y=97+i*96;g+=tx(25,y,r[0],'strong')+tx(25,y+24,r[1],'sm');g+=line(240,y+38,650,y+38,'grid')+tx(240,y+57,'0','xs','middle')+tx(650,y+57,r[4],'xs','middle');for(let j=0;j<2;j++){const yy=y-12+j*26;g+=tx(215,yy+13,j?'導入後':'導入前','sm','end')+`<rect x="240" y="${yy}" width="${r[j+2]/r[4]*410}" height="17" rx="4" fill="${j?'#25466e':'#dfc69f'}"/>`+tx(250+r[j+2]/r[4]*410,yy+14,r[j+2],'sm');}});break;}
 case 'question-funnel': {
  h=400;const labels=[['大主題','AI 客服'],['場域與對象','某線上商店的客服使用者'],['結果與期間','近三個月的等待時間與滿意度'],['可研究的問題','等待時間與滿意度的關聯為何？']];
  labels.forEach((a,i)=>{const y=20+i*84,w=690-i*75,x=(760-w)/2;g+=`<path d="M${x} ${y}H${x+w}L${x+w-25} ${y+68}H${x+25}Z" fill="${i===3?'#25466e':'#edf3f8'}" stroke="#c8d7e2"/>`+tx(380,y+25,a[0],`sm ${i===3?'light':''}`,'middle')+tx(380,y+51,a[1],`strong ${i===3?'light':''}`,'middle');if(i<3)g+=ar(380,y+70,380,y+79);});g+=tx(380,381,'本例回答「關聯」，不直接回答「導入 AI 是否造成改善」。','sm','middle');break;}
 case 'question-evidence': {
  const rows=[['描述','現在的等待分布？','服務紀錄 → 分布圖'],['比較','兩種流程差多少？','可比較的組別 → 差異'],['關聯','等待與滿意如何連動？','配對的兩個變項 → 散點'],['理解','哪些經驗讓人失望？','訪談／觀察 → 脈絡解釋']];
  rows.forEach((r,i)=>{const y=20+i*74;g+=node(20,y,105,57,r[0],'','dark')+ar(130,y+28,165,y+28)+node(175,y,265,57,r[1])+ar(445,y+28,475,y+28)+node(485,y,255,57,r[2],'','tint');});break;}
 case 'search-path':
  h=370;g=rect(20,15,720,64,'tint')+tx(40,41,'檢索式示例','sm')+tx(40,64,'("AI客服" OR chatbot) AND (滿意度 OR satisfaction)','strong');
  g+=flow([['建立關鍵詞','概念與同義詞'],['搜尋與去重','保留查詢紀錄'],['篩題名與摘要','記下排除理由'],['閱讀並核對全文','建立核心文獻庫']],126);
  g+=pathAr('M650 210 V264 H110 V210',true)+tx(380,293,'回看漏掉的關鍵詞、追蹤引用與被引用文獻','sm','middle');break;
 case 'source-trace':
  h=370;g=flow([['論文中的主張','AI 回覆速度更快'],['找到原始研究','不是只引二手摘要'],['定位原文證據','段落、頁碼、圖表'],['核對支持範圍','對象、設計、限制']],70);
  g+=rect(40,209,680,107,'warm')+tx(60,239,'最小引用卡','heading')+tx(60,266,'作者與年份  /  題名  /  DOI 或穩定網址  /  證據位置','sm')+tx(60,292,'自己的摘要  /  能支持什麼  /  不能支持什麼','sm');break;
 case 'literature-matrix': {
  h=340;const xs=[20,125,300,475,740],rows=[['教學條目','研究情境','資料與方法','仍未回答'],['虛構 A','一般客服','一次性問卷','等待過程如何發生？'],['虛構 B','複雜申訴','深度訪談','模式是否可推廣？'],['虛構 C','單一平台','服務紀錄','使用者如何理解？']];
  rows.forEach((r,i)=>{let y=26+i*62;g+=rect(20,y,720,59,i===0?'dark':i%2?'tint':'node',5);r.forEach((s,j)=>g+=tx(xs[j]+14,y+36,s,i===0?'light strong':'sm'));});g+=tx(380,312,'待解問題來自比較後的論證，不只是「沒人研究這個地方」。','sm','middle');break;}
 case 'concept-map':
  h=380;g=node(20,140,180,80,'等待時間','自變項候選')+node(290,140,180,80,'被重視的感受','機制／中介候選','tint')+node(560,140,180,80,'滿意度','結果變項','dark');
  g+=ar(205,180,281,180,true)+ar(475,180,551,180,true)+tx(245,162,'待檢驗','xs','middle')+tx(515,162,'待檢驗','xs','middle');
  g+=node(290,15,180,70,'服務情境','使用者與案件特性','warm')+pathAr('M290 50 H110 V133',true)+pathAr('M470 50 H650 V133',true)+tx(380,293,'概念定義 → 測量方式 → 設計條件 → 才能檢驗','strong','middle')+tx(380,328,'此圖是本課程假想架構，不是已經成立的模型。','sm','middle');break;
 case 'design-tree':
  h=400;g=node(230,15,300,65,'研究問題要回答什麼？','','dark');
  [['描述或比較','數值／類別的分布','調查、紀錄或實驗',20],['理解經驗','行動、意義與脈絡','訪談、觀察或文本',270],['改善並評估','原型與使用成效','設計、試行與比較',520]].forEach(a=>{g+=pathAr(`M380 82 V109 H${a[3]+110} V134`)+node(a[3],144,220,78,a[0],a[1],'tint')+ar(a[3]+110,225,a[3]+110,250)+node(a[3],260,220,60,a[2]);});g+=tx(380,368,'同時需要多種證據 → 明確設計資料之間如何整合','sm','middle');break;
 case 'sampling-frame': {
  h=390;const rows=[['目標母體','希望理解的全部使用者',700],['抽樣框','實際可取得的名單',610],['受邀者','按抽樣規則邀請的人',520],['回覆者','真正留下資料的人',430],['分析樣本','符合預先說明規則的紀錄',340]];
  rows.forEach((a,i)=>{const y=15+i*69;g+=rect(20,y,a[2],56,i===4?'dark':i%2?'warm':'tint',8)+tx(39,y+34,a[0],`strong ${i===4?'light':''}`)+tx(177,y+34,a[1],`sm ${i===4?'light':''}`);if(i<4)g+=ar(75,y+57,75,y+66);});g+=tx(740,381,'寬度僅示意範圍，不代表真實人數比例。','xs','end');break;}
 case 'measurement-chain':
  h=370;g=flow([['構念','被重視的感受'],['面向','得到個別化回應'],['題項','這次回應符合需求'],['紀錄','1–5 分；未答為缺失']],84);
  g+=rect(28,225,704,95,'warm')+tx(48,253,'預試時，請受試者說說他怎麼理解這道題。','strong')+tx(48,281,'檢查：用詞是否清楚？是否一題問兩件事？時間範圍是否一致？','sm')+tx(48,304,'題項示例僅供教學；正式採用需重新確認來源、品質與使用條件。','xs');break;
 case 'ethics-gates':
  h=370;g=flow([['確認程序','機構倫理與授權'],['告知與自願','用途、選擇與退出'],['最小蒐集','只收需要的資料'],['安全管理','權限、保存與刪除']],85);
  g+=rect(50,225,660,90,'warm')+tx(75,255,'任何一關不清楚 → 先停下來向指導教師或機構確認','strong')+tx(75,286,'程序適用於研究準備到結束，不只是一張勾選過的同意書。','sm');break;
 case 'service-blueprint': {
  h=360;const rows=[['使用者','提出問題','收到制式回覆','再次說明','得到解決'],['前台','接收提問','立即確認收件','轉接專員','說明處理結果'],['後台','辨識案件','查詢資料','判斷例外狀況','完成處理']];
  [0,1,2,3].forEach((i)=>g+=tx(205+i*150,28,['接觸','等待','處理','完成'][i],'sm','middle'));
  rows.forEach((r,i)=>{const y=50+i*91;g+=rect(20,y,720,79,i%2?'tint':'node',8)+tx(35,y+45,r[0],'strong');r.slice(1).forEach((v,j)=>{g+=tx(205+j*150,y+44,v,'sm','middle');if(j<3)g+=ar(266+j*150,y+39,287+j*150,y+39);});});
  g+=`<rect x="279" y="46" width="150" height="268" rx="12" fill="none" stroke="#a57637" stroke-width="2" stroke-dasharray="5 4"/>`+tx(380,345,'追問：收到回覆之後，問題真的開始被處理了嗎？','strong','middle');break;}
 case 'interview-funnel':
  h=380;[['開放敘事','請談一次印象深刻的客服經驗。'],['追問事件','你收到回覆後，接著做了什麼？'],['澄清意義','你說「被敷衍」，指的是哪一個時刻？'],['核對理解','我這樣理解是否貼近你的意思？']].forEach((r,i)=>{const y=20+i*81;g+=node(20,y,135,63,r[0],'',i===3?'dark':'tint')+ar(160,y+32,187,y+32)+node(195,y,545,63,r[1]);if(i<3)g+=ar(86,y+64,86,y+77);});g+=tx(380,371,'避免：「你是不是覺得 AI 客服很沒溫度？」','gold sm','middle');break;
 case 'coding-trace':
  h=410;g=rect(20,18,720,95,'warm')+tx(40,47,'虛構訪談原話','sm')+tx(40,78,'「他馬上回我，但我一直重複說明，最後還是找真人。」','heading');
  g+=ar(380,118,380,143)+node(20,155,220,75,'回覆迅速','原話支持的描述')+node(270,155,220,75,'重複說明','原話支持的描述')+node(520,155,220,75,'轉求真人','原話支持的描述');
  g+=pathAr('M130 234 V262 H380 V285')+ar(380,234,380,285)+pathAr('M630 234 V262 H380 V285');
  g+=node(155,295,450,78,'候選主題：被回覆，不等於被理解','回到其他片段、反例與情境繼續檢查','dark');break;
 case 'case-matrix': {
  h=355;const rows=[['虛構個案','等待的感受','問題是否解決','值得再追問'],['A','很快回覆','沒有','速度與理解的落差'],['B','等了一段時間','有','可接受等待的條件'],['C','很快回覆','有','不要忽略順利案例']];
  rows.forEach((r,i)=>{const y=22+i*67;g+=rect(20,y,720,62,i===0?'dark':i===2?'warm':'node',6);r.forEach((s,j)=>g+=tx([36,167,365,527][j],y+37,s,i===0?'light strong':'sm'));});g+=tx(380,330,'用反例修正主題，而不是把反例當成「不重要」。','strong','middle');break;}
 case 'alignment-map':
  h=380;g=flow([['問題','等待與滿意有關？'],['資料','同一人的兩個變項'],['分析','分布、散點與模型'],['結論','關聯程度與限制']],70);
  g+=rect(20,235,720,93,'warm')+tx(42,265,'常見斷點','heading')+tx(42,292,'只問整體滿意度，卻想回答「等待時間造成多少影響」。','sm')+tx(42,315,'修正：補足資料與設計，或縮小問題與主張。','sm');break;
 case 'design-clinic':
  h=350;g=node(25,35,300,77,'1. 提案者說明','只講一個核心問題')+node(435,35,300,77,'2. 同儕找斷點','哪一項證據還不存在？','tint')+node(435,220,300,77,'3. 選擇修正','改問題、改資料或改設計')+node(25,220,300,77,'4. 重做對齊','記錄取捨與尚待確認事項','dark');g+=ar(330,74,426,74)+ar(585,117,585,211)+ar(430,259,334,259)+ar(175,215,175,121);break;
 case 'data-cleaning':
  h=390;g=rect(20,20,325,191,'warm')+rect(415,20,325,191,'tint')+tx(40,48,'原始紀錄（保留不覆寫）','strong')+tx(435,48,'分析表（每列＝一次服務）','strong');
  ['id     等待      滿意度','01     8 分      4','02     空白      3','03     2 分      5'].forEach((s,i)=>g+=tx(40,84+i*33,s,'mono'));
  ['id     wait_min   satisfaction','01          8             4','02         NA             3','03          2             5'].forEach((s,i)=>g+=tx(435,84+i*33,s,'mono'));
  g+=ar(350,121,405,121)+flow([['資料字典','定義、單位、範圍'],['檢查異常','缺失、重複、型態'],['記錄處理','規則、原因、版本']],260);break;
 case 'chart-choice': {
  h=420;
  const mini=(x,y,label,sub,fn)=>rect(x,y,340,173,'node')+tx(x+18,y+29,label,'strong')+tx(x+18,y+53,sub,'sm')+fn(x,y);
  g+=mini(20,15,'長條圖','類別之間的數量或比例',(x,y)=>[35,60,83,48].map((v,i)=>`<rect x="${x+52+i*57}" y="${y+150-v}" width="31" height="${v}" rx="3" fill="#25466e"/>`).join('')+line(x+35,y+150,x+307,y+150));
  g+=mini(400,15,'直方圖','一個數值變項的分布',(x,y)=>[23,50,77,85,61,35,14].map((v,i)=>`<rect x="${x+40+i*36}" y="${y+150-v}" width="35" height="${v}" fill="#6085a8"/>`).join(''));
  g+=mini(20,210,'散點圖','兩個數值變項的關係',(x,y)=>[[50,136],[86,128],[110,91],[152,116],[183,91],[207,104],[247,73],[280,81]].map(a=>circle(x+a[0],y+a[1],5)).join('')+line(x+35,y+155,x+307,y+155));
  g+=mini(400,210,'折線圖','時間先後與變化',(x,y)=>`<path d="M${x+40} ${y+132}l46 -31l46 10l46 -34l46 15l46 -29" stroke="#25466e" stroke-width="3" fill="none"/>`+line(x+35,y+155,x+307,y+155));g+=tx(380,407,'四個小圖只示意形狀與用途，並非真實資料。','xs','middle');break;}
 case 'outlier-lab': {
  h=350;const last=Number(state.outlier??8),a=[2,3,4,5,last],avg=mean(a),sorted=[...a].sort((x,y)=>x-y),med=sorted[2],xx=v=>60+v/30*625;
  g=tx(25,30,'等待時間（分鐘）· 每個點代表一筆資料','sm')+line(60,145,685,145);
  for(let i=0;i<=30;i+=5)g+=line(xx(i),140,xx(i),151)+tx(xx(i),174,i,'sm','middle');
  a.forEach((v,i)=>g+=circle(xx(v),110-(i===3&&last===5?17:0),8,i===4?'#a57637':'#25466e'));
  g+=line(xx(avg),192,xx(avg),241,'line')+circle(xx(avg),193,6,'#25466e')+tx(xx(avg),267,`平均 ${avg.toFixed(2)}`,'strong blue','middle');
  g+=`<path d="M${xx(med)-7} 215l7 -12l7 12Z" fill="#a57637"/>`+tx(xx(med),308,`中位數 ${med.toFixed(2)}`,'strong gold','middle');
  controls=`<label class="slider-label">最後一筆等待時間 <output data-output="outlier">${last}</output> 分鐘<input type="range" min="5" max="30" step="1" value="${last}" data-control="outlier" aria-label="最後一筆等待時間，分鐘"></label><p class="live" aria-live="polite" data-live="outlier">資料：${a.join('、')}；平均數 ${avg.toFixed(2)}，中位數 ${med.toFixed(2)}。</p>`;
  table=`資料依序為 ${a.join('、')} 分鐘；平均數 ${avg.toFixed(2)} 分鐘，中位數 ${med.toFixed(2)} 分鐘。`;break;}
 case 'spread-comparison': {
  h=350;const a=[4,4,5,6,6],b=[1,3,5,7,9],xx=v=>150+v*55;
  [a,b].forEach((arr,i)=>{const y=88+i*146;g+=tx(25,y-23,i?'B 組':'A 組','strong')+tx(25,y+2,'平均＝5','sm')+tx(25,y+27,`樣本 SD＝${sampleSD(arr).toFixed(2)}`,'sm')+line(150,y+29,700,y+29);let counts={};arr.forEach(v=>{const stack=counts[v]||0;counts[v]=stack+1;g+=circle(xx(v),y-stack*20,8,i?'#a57637':'#25466e');});for(let v=0;v<=10;v+=2)g+=tx(xx(v),y+50,v,'xs','middle');});g+=tx(735,331,'等待時間（分鐘）','sm','end');table='A 組：4、4、5、6、6，平均 5，樣本 SD 1；B 組：1、3、5、7、9，平均 5，樣本 SD 約 3.16。';break;}
 case 'sampling-lab': {
  h=355;const n=Number(state.sample??25),se=10/Math.sqrt(n),xx=x=>65+(x-42)/16*630,yy=d=>275-d*410;
  for(let x=42;x<=58;x+=2)g+=line(xx(x),75,xx(x),275,'grid')+tx(xx(x),299,x,'sm','middle');
  for(let d=0;d<=.5;d+=.1)g+=tx(52,yy(d)+5,d.toFixed(1),'xs','end');
  const curve=sd=>Array.from({length:161},(_,i)=>{const x=42+i*.1,d=Math.exp(-.5*((x-50)/sd)**2)/(sd*Math.sqrt(2*Math.PI));return`${i?'L':'M'}${xx(x).toFixed(2)} ${yy(d).toFixed(2)}`;}).join(' ');
  g+=`<path d="${curve(2)}" fill="none" stroke="#b58b52" stroke-width="2" stroke-dasharray="6 4"/><path d="${curve(se)}" fill="none" stroke="#25466e" stroke-width="3"/>`+line(65,275,695,275)+tx(25,26,'抽樣分布密度','sm')+tx(380,337,'樣本平均數（分）','sm','middle')+tx(735,30,`n＝${n}　SE＝${se.toFixed(2)}`,'strong','end')+tx(735,53,'金色虛線：n＝25 的參考曲線','xs','end');
  controls=`<label class="slider-label">每批樣本數 n <output data-output="sample">${n}</output><input type="range" min="25" max="100" step="25" value="${n}" data-control="sample" aria-label="每批樣本數"></label><p class="live" aria-live="polite" data-live="sample">n＝${n}；母體標準差固定 10；標準誤＝${se.toFixed(2)}。樣本平均的分布以 50 為中心。</p>`;
  table=`常態母體 μ＝50、σ＝10；n＝${n} 時，平均數的抽樣分布為平均 50、標準差（標準誤）${se.toFixed(2)} 的常態分布。`;break;}
 case 'confidence-intervals': {
  h=475;const z=[-.5,.2,1.1,-.9,.4,-1.4,2.3,.8,-.1,.6,-1.1,.1,1.4,-.3,-.7,1.8,-2.15,.45,-1.7,.9],xx=x=>95+(x-40)/20*590;
  g=tx(25,25,'已知 σ＝10、n＝25；區間＝平均 ± 1.96 × 2','sm')+line(xx(50),44,xx(50),408,'line')+tx(xx(50),448,'固定真值 μ＝50','strong','middle');
  for(let x=40;x<=60;x+=5)g+=tx(xx(x),422,x,'xs','middle');
  z.forEach((v,i)=>{const m=50+2*v,y=50+i*18,hit=Math.abs(v)<=1.96,col=hit?'#25466e':'#a57637';g+=tx(68,y+4,String(i+1).padStart(2,'0'),'xs','end')+`<line x1="${xx(m-3.92)}" y1="${y}" x2="${xx(m+3.92)}" y2="${y}" stroke="${col}" stroke-width="${hit?2:3}" ${hit?'':'stroke-dasharray="5 3"'}/>`+circle(xx(m),y,3,col);if(!hit)g+=tx(710,y+4,'未含','xs');});g+=tx(25,467,'20 組預先設定的示意樣本均值；本次 18/20 涵蓋，不必恰好 95%。','xs');
  table='各組 z 值為 '+z.join('、')+'；樣本平均＝50＋2z，各區間為樣本平均加減 3.92。第 7、17 組未涵蓋 50，其餘涵蓋。';break;}
 case 'independent-paired':
  h=360;g=rect(20,20,340,270,'tint')+rect(400,20,340,270,'warm')+tx(190,54,'獨立兩組','heading','middle')+tx(570,54,'同一人的前後測','heading','middle');
  for(let i=0;i<3;i++){g+=circle(92,112+i*54,16)+tx(92,117+i*54,`A${i+1}`,'xs light','middle')+circle(275,112+i*54,16,'#a57637')+tx(275,117+i*54,`B${i+1}`,'xs light','middle')+circle(470,112+i*54,16)+tx(470,117+i*54,`P${i+1}`,'xs light','middle')+ar(496,112+i*54,642,112+i*54)+circle(669,112+i*54,16,'#a57637')+tx(669,117+i*54,`P${i+1}`,'xs light','middle');}
  g+=tx(190,272,'比較兩組的分布與中心','sm','middle')+tx(570,272,'計算每人的差值，再分析差值','sm','middle')+tx(380,329,'圖中配對關係來自設計，不是因為兩組人數剛好一樣。','strong','middle');break;
 case 'paired-trajectories': {
  h=370;const before=[2,3,3,4,1],after=[3,4,3,5,3],yy=v=>285-(v-1)*52;
  for(let v=1;v<=5;v++)g+=line(110,yy(v),570,yy(v),'grid')+tx(85,yy(v)+5,v,'sm','end');
  before.forEach((v,i)=>{const delta=(i-2)*7;g+=`<path d="M180 ${yy(v)+delta}L500 ${yy(after[i])+delta}" stroke="${i===2?'#a57637':'#5e83a3'}" stroke-width="2" fill="none" ${i===2?'stroke-dasharray="5 4"':''}/>`+circle(180,yy(v)+delta,5)+circle(500,yy(after[i])+delta,5)+tx(530,yy(after[i])+delta+5,`P${i+1}`,'xs');});
  g+=tx(180,317,'前測','strong','middle')+tx(500,317,'後測','strong','middle')+tx(30,28,'滿意評分（1–5 分）','sm')+rect(592,92,148,122,'warm')+tx(666,128,'平均差','sm','middle')+tx(666,167,'+1.0','big','middle')+tx(666,194,'後測 − 前測','xs','middle')+tx(30,354,'線條略微錯開以免重疊；確切數值見文字說明。分數為教學模擬。','xs');
  table='P1：2→3；P2：3→4；P3：3→3；P4：4→5；P5：1→3。前測平均 2.6，後測平均 3.6，平均差 1.0。';break;}
 case 'regression-lab': {
  h=365;const x=[1,2,3,4,5,6,7,8,9,10],y=[4.4,4.1,4.7,3.5,4,3.1,3.8,2.7,3.3,2.4],mx=mean(x),my=mean(y),ssx=x.reduce((s,v)=>s+(v-mx)**2,0),ssy=y.reduce((s,v)=>s+(v-my)**2,0),sp=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0),b=sp/ssx,a=my-b*mx,r=sp/Math.sqrt(ssx*ssy),xx=v=>80+v*56,yy=v=>285-(v-1)*53,show=state.regression!==false;
  for(let v=1;v<=5;v++)g+=line(80,yy(v),696,yy(v),'grid')+tx(65,yy(v)+5,v,'sm','end');
  for(let v=0;v<=10;v+=2)g+=tx(xx(v),313,v,'sm','middle');
  if(show)g+=`<path d="M${xx(1)} ${yy(a+b)}L${xx(10)} ${yy(a+10*b)}" fill="none" stroke="#a57637" stroke-width="3"/>`;
  x.forEach((v,i)=>g+=circle(xx(v),yy(y[i]),6));
  g+=line(80,285,696,285)+tx(25,27,'滿意度（1–5 分）','sm')+tx(380,349,'等待時間（分鐘）','sm','middle')+tx(732,27,`r＝${r.toFixed(2)}`,'strong','end')+tx(732,52,`預測滿意度＝${a.toFixed(2)} ${b<0?'−':'＋'} ${Math.abs(b).toFixed(2)} × 等待`,'xs','end');
  controls=`<button type="button" data-control="regression" aria-pressed="${show}">${show?'隱藏':'顯示'}趨勢線</button><span class="inline-note">同一組資料；切換不會改變 r。</span>`;
  table=`等待時間依序為 ${x.join('、')} 分鐘，對應滿意度為 ${y.join('、')}。Pearson r＝${r.toFixed(4)}；最小平方法截距＝${a.toFixed(4)}，斜率＝${b.toFixed(4)}。`;break;}
 case 'confounding-dag':
  h=350;g=node(230,20,300,78,'案件複雜程度','待檢查的共同原因','warm')+node(30,235,260,75,'等待時間','X','tint')+node(470,235,260,75,'滿意度','Y','dark');
  g+=ar(275,104,170,226)+ar(485,104,585,226)+ar(297,272,460,272,true)+tx(380,255,'待識別的因果效果？','sm','middle')+tx(108,166,'可能增加等待','sm')+tx(495,166,'也可能影響滿意','sm');break;
 case 'double-diamond':
  h=390;g=`<path d="M25 180L200 60L375 180L200 300Z" fill="#edf3f8" stroke="#6085a8" stroke-width="2"/><path d="M385 180L560 60L735 180L560 300Z" fill="#faf3e7" stroke="#b58b52" stroke-width="2"/>`+line(200,60,200,300,'grid')+line(560,60,560,300,'grid');
  [['探索',117,'Discover'],['界定',285,'Define'],['發展',473,'Develop'],['交付',641,'Deliver']].forEach(r=>g+=tx(r[1],178,r[0],'heading','middle')+tx(r[1],205,r[2],'xs','middle'));
  g+=tx(200,28,'理解問題','strong','middle')+tx(560,28,'探索解法','strong','middle')+tx(200,333,'發散 → 收斂','sm','middle')+tx(560,333,'發散 → 收斂','sm','middle')+tx(380,376,'依 Design Council 雙鑽石概念改繪 · CC BY 4.0 · 可反覆迭代','xs','middle');break;
 case 'evaluation-chain':
  h=370;g=flow([['投入','人力、系統、時間'],['活動','測試轉接新流程'],['產出','完成可用的原型'],['結果','解決率與感受改善']],70);
  g+=node(30,237,220,80,'成效指標','解決率、等待、滿意','tint')+node(270,237,220,80,'比較方式','誰與誰、何時與何時','tint')+node(510,237,220,80,'副作用','成本、負荷、可近用性','warm')+pathAr('M650 156 V197 H140 V229')+pathAr('M650 197 H380 V229')+pathAr('M650 197 H620 V229');break;
 case 'claim-boundary': {
  h=400;[['描述樣本','本批回覆者的分布與經驗','能定位資料與研究情境'],['報告關聯','兩個變項如何共同變化','測量合適、檢查模型與限制'],['推論母體','結果可能適用到哪些人','抽樣、偏差與不確定性有依據'],['提出因果說明','介入造成什麼改變','比較設計與識別假設可辯護']].forEach((r,i)=>{const y=15+i*85;g+=node(20,y,147,67,r[0],'',i===3?'dark':'tint')+ar(172,y+33,195,y+33)+rect(205,y,535,67,i===3?'warm':'node')+tx(224,y+27,r[1],'strong')+tx(224,y+52,r[2],'sm');});g+=tx(380,386,'另外的路徑：理解意義與脈絡，也能形成可信而有邊界的知識。','sm','middle');break;}
 case 'reproducibility-map':
  h=370;g=flow([['原始資料','依授權限制存取'],['處理紀錄','規則、排除與轉碼'],['分析步驟','程式、設定、版本'],['報告圖表','對應結果與資料']],66);
  g+=node(210,237,340,82,'README 與資料字典','說明文件如何互相對應','warm')+pathAr('M110 151 V191 H300 V229')+ar(325,151,345,229)+ar(435,151,414,229)+pathAr('M650 151 V191 H460 V229');break;
 case 'defense-story': {
  h=360;const minutes=[1,1,2,2,1,1],labels=['問題','缺口','資料','方法','限制','下一步'];let left=25;
  minutes.forEach((m,i)=>{const w=m*87;g+=rect(left,108,w-4,90,i%2?'tint':'dark',8)+tx(left+(w-4)/2,143,labels[i],i%2?'strong':'strong light','middle')+tx(left+(w-4)/2,173,`${m} 分`,i%2?'sm':'sm light','middle');left+=w;});
  g+=tx(380,50,'8 分鐘示範配置','heading','middle')+line(25,222,721,222)+tx(25,246,'0 分','sm')+tx(721,246,'8 分','sm','end')+tx(380,305,'讓每一段回答一個問題，而不是唸完一張投影片。','strong','middle');break;}
 case 'answer-loop':
  h=330;g=flow([['確認問題','您問的是樣本偏差？'],['回到證據','目前採便利抽樣'],['說明邊界','不主張代表全部用戶'],['提出修正','補充抽樣與限制']],100);break;
 case 'revision-loop':
  h=375;g=flow([['回饋','問題與資料不對齊'],['決策','縮小本次問題'],['修改','第 2、3 節與架構圖'],['驗證','逐項回查對應關係']],52);
  g+=rect(20,225,340,107,'warm')+rect(400,225,340,107,'tint')+tx(40,254,'修訂前','sm')+tx(40,285,'AI 是否提升全體顧客滿意度？','strong')+tx(420,254,'修訂後（一次性問卷示例）','sm')+tx(420,285,'回覆者的等待與滿意有何關聯？','strong')+ar(365,279,391,279);break;
 case 'launch-roadmap':
  h=395;g=flow([['確認範圍','問題、資源與角色'],['完成前置確認','倫理程序與資料授權'],['試行與修正','工具、負荷、紀錄'],['正式啟動','蒐集、備份、檢核']],70);
  g+=rect(30,229,700,116,'warm')+tx(52,260,'每一道關卡，都要有可檢查的完成條件。','heading')+tx(52,290,'例如：可用的資料字典、已確認的授權、適用的倫理程序、預試紀錄。','sm')+tx(52,321,'若正式開始後改變對象、工具或用途，重新確認相關程序。','sm');break;
 default: throw new Error(`Unknown diagram type: ${type}`);
 }
 if(!table){const decoder=document.createElement('textarea');table='圖中文字（依圖面繪製順序）：'+[...g.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map(m=>{decoder.innerHTML=m[1];return decoder.value;}).join('；')+'。圖中關係請併讀讀圖重點。';}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 ${h}" role="img" aria-labelledby="${uid}-title ${uid}-desc"><title id="${uid}-title">${esc(title)}</title><desc id="${uid}-desc">${esc(desc)} ${esc(table)}</desc><defs><style>${SVG_STYLE}</style><marker id="${uid}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L8 4L0 8Z" fill="#587793"/></marker></defs><rect width="760" height="${h}" fill="#f8fafc"/>${g}</svg>`;
 return {svg,controls,table};
}

const CSS=`
:host{display:block;--rv-ink:#243c50;--rv-blue:#25466e;--rv-border:#d3dfe8;--rv-muted:#50667a;--rv-gold:#a57637;color:var(--rv-ink);font-family:system-ui,-apple-system,"Microsoft JhengHei","Noto Sans CJK TC",sans-serif;font-size:16px;line-height:1.7;contain:content;color-scheme:light}*{box-sizing:border-box} .head{margin:0 0 22px}.eyebrow{font-size:12px;letter-spacing:.16em;color:var(--rv-muted);text-transform:uppercase;font-weight:700}h2{font-size:clamp(23px,3.3vw,32px);line-height:1.45;margin:8px 0 9px;letter-spacing:.015em}.question{margin:0;color:var(--rv-muted);font-size:16px}.cards{display:grid;gap:26px}.card{border:1px solid var(--rv-border);border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 7px 30px #17364f06}.card-head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;padding:23px 25px 16px}.number{font-family:Georgia,serif;font-size:31px;line-height:1.2;color:#a57637;min-width:34px}.label{font-size:12px;color:var(--rv-muted);letter-spacing:.09em}h3{font-size:19px;line-height:1.5;margin:4px 0 0}.title-wrap{display:flex;gap:14px;flex:1}.tool{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}button{font:inherit;line-height:1.3;min-height:44px;padding:9px 13px;border:1px solid var(--rv-border);border-radius:8px;background:#fff;color:var(--rv-blue);cursor:pointer;font-size:14px}button:hover{border-color:var(--rv-blue);background:#f0f5f9}button:focus-visible,summary:focus-visible,a:focus-visible,input:focus-visible,.canvas:focus-visible{outline:3px solid #a57637;outline-offset:4px}figure{margin:0}.canvas{overflow:auto;background:#f8fafc;border-block:1px solid #e3ebf1;scrollbar-width:thin}.canvas svg{display:block;width:100%;height:auto;min-width:650px}.scroll-hint{font-size:12px;color:var(--rv-muted);padding:6px 25px;background:#f8fafc;display:none}.controls{padding:16px 25px;background:#f4f7fa;border-bottom:1px solid #e3ebf1}.controls:empty{display:none}.slider-label{display:grid;grid-template-columns:1fr auto;align-items:center;gap:6px;font-weight:600;font-size:14px}.slider-label output{font-variant-numeric:tabular-nums;color:var(--rv-blue)}input[type=range]{display:block;grid-column:1/-1;width:100%;height:30px;accent-color:var(--rv-blue);cursor:pointer}.live{font-size:13px;color:var(--rv-muted);margin:7px 0 0}.inline-note{font-size:13px;color:var(--rv-muted);margin-left:10px}figcaption{padding:20px 25px}.read{margin:0 0 15px;font-size:15px}.read b{color:var(--rv-blue);display:block;font-size:12px;letter-spacing:.1em;margin-bottom:5px}.warning{padding:12px 15px;border-left:3px solid #c49c65;border-radius:0 8px 8px 0;background:#fbf6ec;font-size:13px;line-height:1.8;margin:0}.warning b{font-weight:700}details{padding:13px 25px 15px;border-top:1px solid #e3ebf1;font-size:13px}summary{cursor:pointer;color:var(--rv-muted);min-height:30px;padding-top:2px}.details-body{padding-top:8px}a{color:var(--rv-blue);text-underline-offset:3px}.ref{display:block;margin:6px 0}.credit{font-size:12px;color:var(--rv-muted);margin:18px 0 0}.table-text{white-space:normal}.error{padding:20px;border:1px solid #c49c65;background:#fbf6ec}dialog{padding:0;width:min(1100px,96vw);max-height:94vh;border:1px solid #c8d7e2;border-radius:14px;color:var(--rv-ink);background:#fff}dialog::backdrop{background:#172d43b3}.dialog-top{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:15px 22px}.dialog-top h3{font-size:18px;margin:0}.dialog-body{max-height:calc(94vh - 150px);overflow:auto;padding:12px;background:#f8fafc}.dialog-body svg{display:block;min-width:760px;width:100%;height:auto}.dialog-note{font-size:13px;padding:10px 22px;margin:0;color:var(--rv-muted)}@media(max-width:680px){.card-head{padding:18px 16px;flex-wrap:wrap;gap:12px}.title-wrap{flex-basis:100%}.tool{margin-left:48px}.scroll-hint{display:block;padding-inline:16px}.controls,figcaption{padding:16px}details{padding-inline:16px}.card{border-radius:13px}h3{font-size:18px}.cards{gap:22px}.number{font-size:28px}.inline-note{display:block;margin:8px 0 0}.dialog-top{padding:12px}.dialog-top h3{font-size:15px}.dialog-body{padding:0}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}@media print{:host{font-size:11pt}.tool,.controls,dialog,.scroll-hint{display:none!important}.card{box-shadow:none;border-color:#aabcca;break-inside:avoid;page-break-inside:avoid;margin-bottom:16px}.canvas{overflow:visible}.canvas svg{min-width:0!important;width:100%}.cards{gap:16px}.card-head{padding:12px 15px}.number{font-size:22px}h2{font-size:20pt}h3{font-size:14pt}figcaption{padding:12px 15px}.read{font-size:10pt}.warning{font-size:9pt}details{display:none}.credit{font-size:8pt}}
`;
class ResearchChapterVisuals extends HTMLElement {
 static get observedAttributes(){return ['chapter'];}
 constructor(){super();this.attachShadow({mode:'open'});this.state={outlier:8,sample:25,regression:true};this.onClick=this.onClick.bind(this);this.onInput=this.onInput.bind(this);}
 connectedCallback(){this.render();this.shadowRoot.addEventListener('click',this.onClick);this.shadowRoot.addEventListener('input',this.onInput);}
 disconnectedCallback(){this.shadowRoot.removeEventListener('click',this.onClick);this.shadowRoot.removeEventListener('input',this.onInput);}
 attributeChangedCallback(name,oldValue,newValue){if(oldValue!==newValue&&this.isConnected){this.state={outlier:8,sample:25,regression:true};this.render();}}
 get chapter(){const n=Number(this.getAttribute('chapter'));return Number.isInteger(n)&&n>=1&&n<=18?n:null;}
 makeFigure(index){const f=chapters[this.chapter-1].figures[index];return svgFigure(f[0],f[1],f[3],this.state);}
 render(){
  if(!this.chapter){this.shadowRoot.innerHTML=`<style>${CSS}</style><p class="error" role="alert">請指定 1–18 的章節編號，例如 chapter="1"。未載入任何其他章節。</p>`;return;}
  const chapter=chapters[this.chapter-1];
  this.shadowRoot.innerHTML=`<style>${CSS}</style><section aria-label="第 ${this.chapter} 章圖解教材"><header class="head"><div class="eyebrow">CHAPTER ${String(this.chapter).padStart(2,'0')} / ${esc(chapter.stage)} / VISUAL NOTES</div><h2>${esc(chapter.title)}</h2><p class="question">${esc(chapter.question)}</p></header><div class="cards">${chapter.figures.map((f,i)=>{const v=this.makeFigure(i);return `<article class="card" data-figure="${i}"><header class="card-head"><div class="title-wrap"><span class="number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><div class="label">${esc(f[2])}</div><h3>${esc(f[1])}</h3></div></div><div class="tool"><button type="button" data-action="zoom" data-index="${i}" aria-label="放大：${esc(f[1])}">放大</button><button type="button" data-action="download" data-index="${i}" aria-label="下載 SVG：${esc(f[1])}">SVG</button></div></header><figure><div class="canvas" tabindex="0" role="region" aria-label="${esc(f[1])}；窄螢幕可左右捲動">${v.svg}</div><div class="scroll-hint">左右滑動看完整圖，或點「放大」。圖中文字不縮成小字。</div><div class="controls">${v.controls}</div><figcaption><p class="read"><b>讀圖重點</b>${esc(f[3])}</p><p class="warning"><b>不要誤讀：</b>${esc(f[4])}</p></figcaption></figure><details><summary>文字說明${f[5].length?'與參考來源':''}</summary><div class="details-body"><p class="table-text">${esc(v.table||f[3])}</p>${f[5].map(key=>`<a class="ref" href="${esc(refs[key][1])}" target="_blank" rel="noopener noreferrer">${esc(refs[key][0])} ↗</a>`).join('')}<p>圖形與教學案例為本課程原創編排；參考來源用於概念查核與延伸閱讀。未複製外部教材圖表。</p></div></details></article>`;}).join('')}</div><p class="credit">服務與科技管理研究所 · 研究方法18週學程 · 圖解補充模組 v1.0.0<br>所有數據、訪談與文獻比較條目皆為教學模擬；不讀取或儲存學生資料。</p></section><dialog aria-labelledby="dialog-title"><div class="dialog-top"><h3 id="dialog-title"></h3><button type="button" data-action="close">關閉</button></div><div class="dialog-body"></div><p class="dialog-note">可左右捲動；按 Esc 或「關閉」回到原圖。圖形未使用點陣文字。</p></dialog>`;
 }
 onInput(event){const input=event.target.closest('[data-control]');if(!input||input.type!=='range')return;const key=input.dataset.control;if(!['outlier','sample'].includes(key))return;this.state[key]=Number(input.value);const card=input.closest('[data-figure]'),index=Number(card.dataset.figure),v=this.makeFigure(index);card.querySelector('.canvas').innerHTML=v.svg;const out=card.querySelector('output');if(out)out.textContent=input.value;const temp=document.createElement('div');temp.innerHTML=v.controls;const live=temp.querySelector('.live');if(live)card.querySelector('.live').textContent=live.textContent;card.querySelector('.table-text').textContent=v.table;}
 onClick(event){
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.control==='regression'){this.state.regression=!this.state.regression;const card=target.closest('[data-figure]'),v=this.makeFigure(Number(card.dataset.figure));card.querySelector('.canvas').innerHTML=v.svg;target.setAttribute('aria-pressed',String(this.state.regression));target.textContent=`${this.state.regression?'隱藏':'顯示'}趨勢線`;return;}
  const action=target.dataset.action,index=Number(target.dataset.index);
  if(action==='close'){this.shadowRoot.querySelector('dialog').close();return;}
  if(!['zoom','download'].includes(action)||!Number.isInteger(index)||index<0||index>1)return;
  const v=this.makeFigure(index),title=chapters[this.chapter-1].figures[index][1];
  if(action==='zoom'){const d=this.shadowRoot.querySelector('dialog');d.querySelector('h3').textContent=title;d.querySelector('.dialog-body').innerHTML=v.svg;d.showModal();return;}
  const data=new Blob([v.svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=`research-week-${String(this.chapter).padStart(2,'0')}-figure-${index+1}.svg`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
}
customElements.define(TAG,ResearchChapterVisuals);
// Read-only metadata helps host applications build their own menus, without duplicating titles.
window.ResearchVisuals=Object.freeze({version:'1.0.0',chapters:Object.freeze(chapters.map((c,i)=>Object.freeze({chapter:i+1,title:c.title,stage:c.stage,figures:Object.freeze(c.figures.map(f=>f[1]))})))});
})();
