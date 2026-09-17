# 原站首頁圖案更正

唯一視覺基準：https://research-methods-18.e5060b85-02c2-4336-b68d-483091a94ab8.chatgpt.site/

已恢復原站 `.joint-portal` 首頁結構與樣式，逐位元組保存原站引用的8個 AVIF/WebP 桌面／手機背景檔；不是將舊設計圖裁成兩張背景，也沒有重新生成圖片。手機使用原站780px切換條件，古今兩側始終左右並列。

`assets/original-homepage/source-manifest.json` 記錄來源網址、大小與 SHA-256。背景圖均在 GitHub 本地託管，首頁只含 HTML/CSS 與圖片。字型樣式引用原站公開字型URL；本儲存庫與附件不含字型檔。

導覽邊界：
- 現代「進入」維持 GitHub 圖解版的 `./visuals/` 目的地。
- 「我的學習紀錄」、「教師管理」、底部「免帳號留言與評量」連回原課程的 `/progress`、`/teacher`、`/course`。連結有原站說明，沒有複製或移轉紀錄。
- 古代入口維持原站停用按鈕與「入口預留 · 尚未開放」。
- 36组圖解、作答、留言與資料庫未修改。

這是首頁視覺更正，不是完整課程後端移轉。`tests/check_homepage.py` 驗證圖片雜湊、來源圖比較、七個尺寸、古今並列、圖片載入、現代入口及正式Pages部署。
