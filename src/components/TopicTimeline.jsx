import React, { useState, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { buildUrlMap, processContent, buildMdComponents, CiteRefList } from './CiteBadge'
import './TopicTimeline.css'

const TOPIC_PALETTE = [
  { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af', dot: '#2563eb' },
  { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d', dot: '#ec4899' },
  { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46', dot: '#10b981' },
  { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', dot: '#f59e0b' },
  { bg: '#ede9fe', border: '#c4b5fd', text: '#4c1d95', dot: '#7c3aed' },
  { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', dot: '#ef4444' },
  { bg: '#e0f2fe', border: '#7dd3fc', text: '#075985', dot: '#0ea5e9' },
  { bg: '#f0fdf4', border: '#86efac', text: '#14532d', dot: '#22c55e' },
  { bg: '#fff7ed', border: '#fdba74', text: '#7c2d12', dot: '#f97316' },
  { bg: '#f5f3ff', border: '#a78bfa', text: '#3730a3', dot: '#6366f1' },
  { bg: '#ecfdf5', border: '#34d399', text: '#064e3b', dot: '#059669' },
  { bg: '#fdf2f8', border: '#e879f9', text: '#701a75', dot: '#d946ef' },
  { bg: '#eff6ff', border: '#60a5fa', text: '#1d4ed8', dot: '#3b82f6' },
  { bg: '#f0fdfa', border: '#2dd4bf', text: '#134e4a', dot: '#14b8a6' },
  { bg: '#fefce8', border: '#fde047', text: '#713f12', dot: '#eab308' },
]

function formatDateHeader(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function getWeekday(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('zh-TW', { weekday: 'short' })
  } catch {
    return ''
  }
}

function formatFullDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  } catch {
    return dateStr
  }
}

function ReaderView({ article, activeCell }) {
  const urlMap = useMemo(() => buildUrlMap(article.metadata?.urls), [article.metadata?.urls])
  const { processedContent, refNumbers } = useMemo(() => processContent(article.content), [article.content])
  const mdComponents = useMemo(() => buildMdComponents(urlMap), [urlMap])

  return (
    <div className="tl-reader">
      <div className="tl-reader-meta">
        {article.metadata?.topic && (
          <span
            className="tl-article-topic-tag"
            style={{ background: activeCell.color.bg, color: activeCell.color.text, borderColor: activeCell.color.border }}
          >
            {article.metadata.topic}
          </span>
        )}
        {article.metadata?.algo && (
          <span className="tl-article-algo">{article.metadata.algo}</span>
        )}
      </div>
      <h2 className="tl-reader-title">{article.title}</h2>
      {article.date && (
        <div className="tl-reader-date">{formatFullDate(article.date.split('T')[0])}</div>
      )}
      <div className="tl-reader-body">
        {processedContent ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {processedContent}
          </ReactMarkdown>
        ) : (
          <p className="tl-reader-empty">無內容</p>
        )}
      </div>
      {Object.keys(refNumbers).length > 0 && (
        <div className="tl-reader-sources">
          <div className="tl-reader-sources-label">參考來源</div>
          <CiteRefList refNumbers={refNumbers} urlMap={urlMap} />
        </div>
      )}
    </div>
  )
}

function TopicTimeline({ data }) {
  const [activeCell, setActiveCell] = useState(null) // { date, label, topics, articles, color }
  const [clickedKey, setClickedKey] = useState(null)
  const [readingArticle, setReadingArticle] = useState(null) // article being read inside drawer

  const { dates, orderedGroups, cellMap, dataIndexMap } = useMemo(() => {
    const dates = [...new Set(data.map(d => d.date?.split('T')[0]).filter(Boolean))].sort()

    // Build group structure keyed by group_id, preserving first-appearance order
    const groupMap = new Map() // groupId -> { topics: [], firstSeen: number }
    const dataIndexMap = new Map()
    // cellMap keyed by "date|groupId" — aggregates ALL topics in the group
    const cellMap = {}

    data.forEach((item, idx) => {
      dataIndexMap.set(item, idx)

      const date = item.date?.split('T')[0]
      const topic = item.metadata?.topic
      const groupId = item.metadata?.group_id ?? topic

      if (topic) {
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, { topics: [], firstSeen: groupMap.size })
        }
        const g = groupMap.get(groupId)
        if (!g.topics.includes(topic)) g.topics.push(topic)
      }

      if (date && topic) {
        const key = `${date}|${groupId}`
        if (!cellMap[key]) cellMap[key] = []
        cellMap[key].push(item)
      }
    })

    // Sort groups by first appearance, assign one color per group
    const orderedGroups = [...groupMap.entries()]
      .sort((a, b) => a[1].firstSeen - b[1].firstSeen)
      .map(([groupId, { topics }], gi) => ({
        groupId,
        label: topics[0],          // Y-axis label = first topic
        topics,                     // all topics in group (for drawer subtitle)
        color: TOPIC_PALETTE[gi % TOPIC_PALETTE.length],
        isMulti: topics.length > 1,
      }))

    return { dates, orderedGroups, cellMap, dataIndexMap }
  }, [data])

  const handleCellClick = useCallback((date, group, articles, key) => {
    if (articles.length === 0) return
    setClickedKey(key)
    setTimeout(() => setClickedKey(null), 500)
    setReadingArticle(null)
    setActiveCell({ date, label: group.label, topics: group.topics, articles, color: group.color })
  }, [])

  const handleReadClick = useCallback((article) => {
    setReadingArticle(article)
  }, [])

  const handleBackToList = useCallback(() => {
    setReadingArticle(null)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setActiveCell(null)
    setReadingArticle(null)
  }, [])

  if (dates.length === 0 || orderedGroups.length === 0) {
    return (
      <div className="tl-empty">
        <span className="tl-empty-icon">📊</span>
        <span>無趨勢資料</span>
      </div>
    )
  }

  return (
    <div className="tl-view">
      {/* Scrollable grid container */}
      <div className="tl-scroll-area">
        <div className="tl-grid-wrapper">
          {/* Date header row */}
          <div className="tl-header-row">
            <div className="tl-corner-cell">
              <span className="tl-corner-label">主題 ╲ 日期</span>
            </div>
            {dates.map(date => (
              <div key={date} className="tl-date-header">
                <span className="tl-date-main">{formatDateHeader(date)}</span>
                <span className="tl-date-weekday">{getWeekday(date)}</span>
              </div>
            ))}
          </div>

          {/* One row per group */}
          {orderedGroups.map((group, gi) => {
            const { groupId, label, topics, color, isMulti } = group
            const rowTotal = dates.reduce((n, date) => n + (cellMap[`${date}|${groupId}`]?.length || 0), 0)

            return (
              <div
                key={groupId}
                className="tl-topic-row"
                style={{ animationDelay: `${gi * 40}ms` }}
              >
                {/* Y-axis label: first topic only */}
                <div className="tl-topic-label-cell">
                  <span className="tl-topic-indicator" style={{ background: color.dot }} />
                  <span className="tl-topic-name">{label}</span>

                  {rowTotal > 0 && (
                    <span className="tl-topic-total" style={{ background: color.bg, color: color.text, borderColor: color.border }}>
                      {rowTotal}
                    </span>
                  )}
                </div>

                {/* Date cells: aggregate all topics in this group */}
                {dates.map(date => {
                  const key = `${date}|${groupId}`
                  const articles = cellMap[key] || []
                  const isClicked = clickedKey === key
                  const isActive = activeCell?.date === date && activeCell?.label === label

                  return (
                    <div
                      key={key}
                      className={[
                        'tl-cell',
                        articles.length > 0 ? 'tl-cell-filled' : 'tl-cell-empty',
                        isClicked ? 'tl-cell-ripple' : '',
                        isActive ? 'tl-cell-active' : '',
                      ].join(' ')}
                      style={articles.length > 0 ? {
                        '--cell-bg': color.bg,
                        '--cell-border': color.border,
                        '--cell-dot': color.dot,
                        '--cell-text': color.text,
                      } : {}}
                      onClick={() => handleCellClick(date, group, articles, key)}
                      role={articles.length > 0 ? 'button' : undefined}
                      tabIndex={articles.length > 0 ? 0 : undefined}
                      onKeyDown={articles.length > 0 ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleCellClick(date, group, articles, key)
                      } : undefined}
                    >
                      {articles.length > 0 && (
                        <div className="tl-cell-inner">
                          <div className="tl-bubble-row">
                            {articles.map((_, bi) => (
                              <div
                                key={bi}
                                className={`tl-bubble ${bi === 0 ? 'tl-bubble-primary' : ''}`}
                                style={{ animationDelay: `${gi * 40 + bi * 80}ms` }}
                              />
                            ))}
                          </div>
                          <div className="tl-count-badge">
                            {articles.length} 篇
                          </div>
                          <div className="tl-preview-title">
                            {articles[0].title}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Article drawer */}
      {activeCell && (
        <div className="tl-drawer-backdrop" onClick={handleCloseDrawer}>
          <div
            className={`tl-drawer ${readingArticle ? 'tl-drawer--reading' : ''}`}
            onClick={e => e.stopPropagation()}
            style={{
              '--drawer-dot': activeCell.color.dot,
              '--drawer-bg': activeCell.color.bg,
              '--drawer-border': activeCell.color.border,
              '--drawer-text': activeCell.color.text,
            }}
          >
            {/* ── Drawer header ── */}
            <div className="tl-drawer-header">
              <div className="tl-drawer-header-left">
                {readingArticle ? (
                  <button className="tl-back-btn" onClick={handleBackToList} type="button">
                    ← 返回列表
                  </button>
                ) : (
                  <>
                    <span className="tl-drawer-topic-dot" style={{ background: activeCell.color.dot }} />
                    <div>
                      <div className="tl-drawer-topic">{activeCell.label}</div>
                      <div className="tl-drawer-date">{formatFullDate(activeCell.date)}</div>
                      {activeCell.topics.length > 1 && (
                        <div className="tl-drawer-topic-chips">
                          {activeCell.topics.map(t => (
                            <span
                              key={t}
                              className="tl-drawer-topic-chip"
                              style={{ background: activeCell.color.bg, color: activeCell.color.text, borderColor: activeCell.color.border }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <button className="tl-drawer-close" onClick={handleCloseDrawer} type="button">
                ✕
              </button>
            </div>

            {readingArticle ? (
              /* ── Article reading mode ── */
              <ReaderView article={readingArticle} activeCell={activeCell} />
            ) : (
              /* ── Article list mode ── */
              <>
                <div className="tl-drawer-count">
                  共 {activeCell.articles.length} 篇文章
                </div>
                <div className="tl-drawer-list">
                  {activeCell.articles.map((article, i) => (
                    <button
                      key={i}
                      className="tl-article-card"
                      style={{ animationDelay: `${i * 60}ms` }}
                      onClick={() => handleReadClick(article)}
                      type="button"
                    >
                      <div className="tl-article-arrow">→</div>
                      <div className="tl-article-body">
                        <div className="tl-article-title">{article.title}</div>
                        <div className="tl-article-meta-row">
                          {article.metadata?.topic && (
                            <span
                              className="tl-article-topic-tag"
                              style={{ background: activeCell.color.bg, color: activeCell.color.text, borderColor: activeCell.color.border }}
                            >
                              {article.metadata.topic}
                            </span>
                          )}
                          {article.metadata?.algo && (
                            <span className="tl-article-algo">{article.metadata.algo}</span>
                          )}
                        </div>
                      </div>
                      <div className="tl-article-read-btn">閱讀</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TopicTimeline
