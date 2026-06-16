一、字體路徑：
https://jimmywu-commits.github.io/shopee/fonts/<br>
在coding時將上述的字體路徑提供給GPT, 裡面包含了三種粗細，分別是：<br>
ShopeeNotoSans(content)-Bold.ttf<br>
ShopeeNotoSans(content)-Medium.ttf<br>
ShopeeNotoSans(content)-Regular.ttf<br>

二、共用js位置：
https://jimmywu-commits.github.io/shopee/js/<br>
layout-runtime.js
排版版位的核心引擎，每個 html/ 裡的版位殼都載入它。負責：
讀取 CSS/config 建立圖層
接收 postMessage（文字、顏色、logo、商品圖）
畫布縮放 fit()
文字直接點擊編輯、字數限制
商品圖排版邏輯
底圖核對 overlay

bn-editor-plugin.js
BN編輯器左側工具列的功能：
Logo 上傳、排序（▲▼）、編輯、移除
商品圖上傳（兩步驟 Modal：選圖→排主/左/右）
商品列表管理（z-index 調整、移除）
下載全部勾選版位（html2canvas）

bn-state-plugin.js
狀態管理和 banwords 橋接：
本機暫存（localStorage，每 30 秒自動存）
下載暫存 / 上傳暫存 JSON
banwords 引擎橋接（blur 後自動轉換）
banwords.xlsx 載入（含 fallback 手動選取 UI）

banwords-engine-hbn.js
禁用語引擎核心（獨立運作）：
讀取 banwords.xlsx 規則
transformText()：文字轉換
applyToElement()：套用到元素
支援 dollarExempt（豁免 $ 和千分位）

logo-editor-plugin.js
Logo 編輯功能（獨立外掛）：
裁切（CropperJS）
加圓角
觸發器（✎ 小按鈕）附加到 logo 縮圖

editor-plugin.js
商品圖編輯功能（獨立外掛）：
商品圖裁切、調整
跟 bn-editor-plugin.js 配合使用

index.js
版位清單，只有一個功能：

三、開發同仁名單：<br>
鄭澤謙	tse.cheng@shopee.com<br>
程祺委	ken.cheng@shopee.com<br>
許書華	jamie.h@shopee.com<br>
李海若	iona.li@shopee.com<br>
