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

  const sortByDateDesc = (arr) =>
    [...arr].sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0
      const tb = b.date ? new Date(b.date).getTime() : 0
      return tb - ta
    })

  useEffect(() => {
    fetch('/newsfeed/data.json')
      .then((res) => res.json())
      .then((json) => {
        setData(sortByDateDesc(json))
        setLoading(false)
      })
      .catch(() => {
        setData(sortByDateDesc(FALLBACK_DATA))
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

  // Compute alternating topic bands: flip 0↔1 whenever the topic changes.
  // Items sharing the same consecutive topic share the same band value.
  const topicBands = (() => {
    let band = 0
    let lastTopic = undefined
    return data.map((item) => {
      const topic = item?.metadata?.topic
      if (lastTopic !== undefined && topic !== lastTopic) band = 1 - band
      lastTopic = topic
      return band
    })
  })()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <p className="loading-text">載入中…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-logo">
            <div className="app-header-logo-mark">
              <svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="5" height="2" rx="1" />
                <rect x="1" y="5" width="12" height="2" rx="1" />
                <rect x="1" y="9" width="9" height="2" rx="1" />
              </svg>
            </div>
            <h1>Feed 牆</h1>
          </div>
          <div className="app-divider" />
          <p className="app-subtitle">世界很吵，五則就好</p>
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
              <>
                <div className="sidebar-header">
                  <span className="sidebar-count">共 {data.length} 篇</span>
                </div>
                {data.map((item, index) => (
                  <ArticleListItem
                    key={index}
                    data={item}
                    isSelected={selectedIndex === index}
                    compact={hasSelection}
                    topicBand={topicBands[index]}
                    onClick={() => handleSelect(index)}
                  />
                ))}
              </>
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
              <span className="empty-detail-icon">📰</span>
              <span>點擊左側文章以閱讀詳細內容</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
