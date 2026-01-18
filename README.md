# Feed 牆 UI

一個基於 React 的卡片式 Feed 牆 UI，用於展示文件類型的資料。

## 功能特色

- 📄 卡片式設計，清晰的資訊階層
- 📱 響應式設計，支援各種裝置
- 🎨 優化的閱讀體驗，合理的留白與行距
- 🔄 可擴充的 metadata 欄位支援

## 快速開始

### 使用 Docker Compose（推薦）

```bash
# 構建並啟動服務
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

服務將在 http://localhost:8080 啟動

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 構建生產版本
npm run build
```

## 資料格式

在 `public/data.json` 中提供您的資料，格式如下：

```json
[
  {
    "title": "文件標題",
    "content": "文件內容",
    "date": "2024-01-15",
    "metadata": {
      "category": "分類",
      "tags": ["標籤1", "標籤2"]
    }
  }
]
```

## 專案結構

```
.
├── src/
│   ├── components/
│   │   ├── Card.jsx      # 卡片組件
│   │   └── Card.css      # 卡片樣式
│   ├── App.jsx           # 主應用組件
│   ├── App.css           # 應用樣式
│   ├── main.jsx          # 入口檔案
│   └── index.css         # 全域樣式
├── public/
│   └── data.json         # 資料檔案
├── Dockerfile            # Docker 構建檔案
├── docker-compose.yml    # Docker Compose 配置
└── package.json          # 專案配置
```

## 技術棧

- React 18
- Vite
- Nginx (生產環境)
