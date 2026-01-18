# 我需要準備的資料

我會提供下方的這些資料，然後請幫我根據下方的spec來呈現資料
[
    {
  "title": "string",
  "content": "string",
  "date": "string",
  "metadata": { }
    }
]


# 卡片式 Feed 牆 UI 規格說明

1. 專案目標（Goal）

使用 React 製作一個 Demo 用的資料呈現 UI，用於以直覺、易讀的方式展示「文件類型」的資料結果。
此 UI 主要聚焦在 閱讀體驗與資訊結構清楚呈現，可作為後續產品或系統的視覺展示範例。

2. 資料呈現概念（UI Concept）

Feed 牆由多張 卡片（Card） 組成

每一張卡片對應 一筆文件資料

使用者可透過上下捲動的方式瀏覽多筆資料

針對單張卡片的 版面配置、字級、留白與可讀性 進行 CSS 優化

3. 資料格式說明（Data Structure）

每一筆資料以 一個 JSON 檔案 表示

每個 JSON 具備以下固定欄位：

{
  "title": "string",
  "content": "string",
  "date": "string",
  "metadata": { }
}

欄位說明：

title

文件標題

於卡片中作為主要視覺焦點

content

文件主要內容

以段落形式呈現，強調可閱讀性

date

文件產生或更新日期

顯示於卡片次要資訊區塊

metadata

彈性欄位（Object）

用於存放可動態擴充的附加資訊（如標籤、來源、狀態、分類等）

UI 可依需求選擇是否顯示、或以不同樣式呈現

4. 卡片呈現原則（Card Design Principles）

每個 JSON 檔對應 一張卡片

卡片樣式以「文件閱讀」為核心設計：

清楚的資訊階層（Title → Content → Meta）

合理的留白與行距

避免視覺雜訊，提升長內容閱讀體驗

卡片樣式具備可擴充性，方便未來新增欄位或互動功能