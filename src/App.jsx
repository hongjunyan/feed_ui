import React, { useState, useEffect, useRef } from 'react'
import ArticleListItem from './components/ArticleListItem'
import Card from './components/Card'
import './App.css'

const FALLBACK_DATA = [
  {
    title: '歡迎使用 Feed 牆 UI',
    content: '這是一個展示文件類型資料的卡片式 Feed 牆介面。您可以透過上下捲動的方式瀏覽多筆資料。每張卡片都經過精心設計，強調閱讀體驗與資訊結構的清楚呈現。',
    date: '2024-01-15',
    metadata: { category: '系統說明', source: 'Demo' },
  },
  {
    title: '設計原則',
    content: '本 UI 以「文件閱讀」為核心設計，具備清楚的資訊階層（Title → Content → Meta）、合理的留白與行距，並避免視覺雜訊，以提升長內容的閱讀體驗。',
    date: '2024-01-14',
    metadata: { category: '設計', tags: ['UI', 'UX', '閱讀體驗'] },
  },
  {
    title: '資料格式',
    content: '每一筆資料包含 title（標題）、content（內容）、date（日期）以及 metadata（彈性欄位）。',
    date: '2024-01-13',
    metadata: { category: '技術', source: '規格文件', status: '已完成' },
  },
]

function App() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const mainPanelRef = useRef(null)

  useEffect(() => {
    fetch('/newsfeed/data.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => {
        setData(FALLBACK_DATA)
        setLoading(false)
      })
  }, [])

  const handleSelect = (index) => {
    setSelectedIndex(index)
    if (mainPanelRef.current) {
      mainPanelRef.current.scrollTop = 0
    }
  }

  const hasSelection = selectedIndex !== null

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
        <div className="app-header-inner">
          <h1>Feed 牆</h1>
          <p className="app-subtitle">產業導向的新聞摘要，每日晚上 12 點更新</p>
        </div>
        {hasSelection && (
          <button
            className="mobile-back-btn"
            onClick={() => setSelectedIndex(null)}
            type="button"
          >
            ← 返回列表
          </button>
        )}
      </header>

      <div className={`app-layout ${hasSelection ? 'has-selection' : ''}`}>
        {/* Layer 1 — article list / sidebar */}
        <aside className="sidebar">
          <div className="sidebar-inner">
            {data.length === 0 ? (
              <div className="empty-state">目前沒有資料</div>
            ) : (
              data.map((item, index) => (
                <ArticleListItem
                  key={index}
                  data={item}
                  isSelected={selectedIndex === index}
                  compact={hasSelection}
                  onClick={() => handleSelect(index)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Layer 2 — article detail */}
        <main className="main-panel" ref={mainPanelRef}>
          {hasSelection ? (
            <div className="detail-inner">
              <Card data={data[selectedIndex]} />
            </div>
          ) : (
            <div className="empty-detail">
              <span>點擊左側文章以閱讀詳細內容</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
