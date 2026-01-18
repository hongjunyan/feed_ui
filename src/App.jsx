import React, { useState, useEffect } from 'react'
import Card from './components/Card'
import './App.css'

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 從 public/data.json 載入資料，如果沒有則使用範例資料
    fetch('/data.json')
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(() => {
        // 如果載入失敗，使用範例資料
        setData([
          {
            title: "歡迎使用 Feed 牆 UI",
            content: "這是一個展示文件類型資料的卡片式 Feed 牆介面。您可以透過上下捲動的方式瀏覽多筆資料。每張卡片都經過精心設計，強調閱讀體驗與資訊結構的清楚呈現。",
            date: "2024-01-15",
            metadata: {
              category: "系統說明",
              source: "Demo"
            }
          },
          {
            title: "設計原則",
            content: "本 UI 以「文件閱讀」為核心設計，具備清楚的資訊階層（Title → Content → Meta）、合理的留白與行距，並避免視覺雜訊，以提升長內容的閱讀體驗。卡片樣式具備可擴充性，方便未來新增欄位或互動功能。",
            date: "2024-01-14",
            metadata: {
              category: "設計",
              tags: ["UI", "UX", "閱讀體驗"]
            }
          },
          {
            title: "資料格式",
            content: "每一筆資料包含 title（標題）、content（內容）、date（日期）以及 metadata（彈性欄位）。metadata 可用於存放標籤、來源、狀態、分類等附加資訊，UI 可依需求選擇是否顯示或以不同樣式呈現。",
            date: "2024-01-13",
            metadata: {
              category: "技術",
              source: "規格文件",
              status: "已完成"
            }
          }
        ])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Feed 牆</h1>
        <p className="app-subtitle">文件資料展示</p>
      </header>
      <main className="feed-container">
        {data.length === 0 ? (
          <div className="empty-state">
            <p>目前沒有資料</p>
          </div>
        ) : (
          data.map((item, index) => (
            <Card key={index} data={item} />
          ))
        )}
      </main>
    </div>
  )
}

export default App
