import React, { useState, useEffect, useMemo, useRef } from 'react'
import './ClusterExplorer.css'

const API_BASE = 'https://pm.moneydj.com/djshakespeare'

// yyyy-mm-dd in local time
function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toISODate(d)
}

const FUN_MESSAGES = [
  '正在閱讀今日的世界…',
  '把幾百則新聞排排站…',
  '找出彼此相關的故事…',
  '幫每個故事貼上標籤…',
  '把雜訊調低，把訊號調高…',
  '讓主題自然浮現…',
  '快好了，再給我幾秒…',
]

// Color palette for clusters
const CLUSTER_COLORS = [
  { bg: '#eff6ff', border: '#bfdbfe', accent: '#2563eb' },
  { bg: '#fef3f2', border: '#fecdd3', accent: '#e11d48' },
  { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' },
  { bg: '#fffbeb', border: '#fde68a', accent: '#d97706' },
  { bg: '#faf5ff', border: '#e9d5ff', accent: '#9333ea' },
  { bg: '#ecfeff', border: '#a5f3fc', accent: '#0891b2' },
  { bg: '#fdf2f8', border: '#fbcfe8', accent: '#db2777' },
  { bg: '#f5f3ff', border: '#ddd6fe', accent: '#7c3aed' },
  { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c' },
  { bg: '#f0f9ff', border: '#bae6fd', accent: '#0284c7' },
]

function colorForCluster(id) {
  return CLUSTER_COLORS[id % CLUSTER_COLORS.length]
}

function FunLoader({ date }) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % FUN_MESSAGES.length)
    }, 4000)
    const tickTimer = setInterval(() => {
      setElapsed((s) => s + 1)
    }, 1000)
    return () => {
      clearInterval(msgTimer)
      clearInterval(tickTimer)
    }
  }, [])

  // ETA bar — assume ~60s
  const progress = Math.min(95, (elapsed / 60) * 100)

  return (
    <div className="cluster-loader">
      <div className="cluster-loader-orbit">
        <div className="orbit-core" />
        <div className="orbit-ring orbit-ring-1">
          <div className="orbit-dot" style={{ background: '#2563eb' }} />
        </div>
        <div className="orbit-ring orbit-ring-2">
          <div className="orbit-dot" style={{ background: '#9333ea' }} />
        </div>
        <div className="orbit-ring orbit-ring-3">
          <div className="orbit-dot" style={{ background: '#16a34a' }} />
        </div>
      </div>
      <div className="cluster-loader-message">{FUN_MESSAGES[msgIndex]}</div>
      <div className="cluster-loader-sub">
        正在分析 {date} 的新聞 · 已花 {elapsed} 秒（通常需要數十秒）
      </div>
      <div className="cluster-loader-bar">
        <div className="cluster-loader-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function ClusterCard({ cluster, items, total, isExpanded, onToggle }) {
  const color = colorForCluster(cluster.cluster_id)
  const share = total > 0 ? (cluster.count / total) * 100 : 0

  return (
    <div
      className={`cluster-card ${isExpanded ? 'cluster-card-expanded' : ''}`}
      style={{ '--c-bg': color.bg, '--c-border': color.border, '--c-accent': color.accent }}
    >
      <button className="cluster-card-header" type="button" onClick={onToggle}>
        <div className="cluster-card-tag">{[...(cluster.topic || '·')][0]}</div>
        <div className="cluster-card-title-block">
          <div className="cluster-card-title">{cluster.topic}</div>
          <div className="cluster-card-meta">
            <span className="cluster-card-count">{cluster.count} 則</span>
            <span className="cluster-card-dot">·</span>
            <span className="cluster-card-share">{share.toFixed(1)}%</span>
          </div>
        </div>
        <div className="cluster-card-chevron" aria-hidden>
          {isExpanded ? '▾' : '▸'}
        </div>
      </button>
      <div className="cluster-card-bar">
        <div className="cluster-card-bar-fill" style={{ width: `${Math.max(2, share)}%` }} />
      </div>
      {isExpanded && (
        <div className="cluster-card-items">
          {items.length === 0 ? (
            <div className="cluster-card-empty">沒有新聞項目</div>
          ) : (
            items.map((item, idx) => (
              <a
                key={`${item.ref || idx}`}
                href={item.news_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cluster-news-item"
              >
                <div className="cluster-news-title">{item.title}</div>
                <div className="cluster-news-meta">
                  {item.date ? new Date(item.date).toLocaleString('zh-TW', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : ''}
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function ClusterExplorer() {
  const yesterday = useMemo(() => getYesterday(), [])
  const [date, setDate] = useState(yesterday)
  const [pendingDate, setPendingDate] = useState(yesterday)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})
  const reqIdRef = useRef(0)

  useEffect(() => {
    const reqId = ++reqIdRef.current
    setLoading(true)
    setError(null)
    setData(null)
    setExpanded({})
    fetch(`${API_BASE}/news/clustering?date=${date}`)
      .then(async (res) => {
        if (!res.ok) {
          let detail = `HTTP ${res.status}`
          try {
            const j = await res.json()
            detail = j.detail || detail
          } catch {}
          throw new Error(detail)
        }
        return res.json()
      })
      .then((json) => {
        if (reqIdRef.current !== reqId) return
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        if (reqIdRef.current !== reqId) return
        setError(err.message || '載入失敗')
        setLoading(false)
      })
  }, [date])

  const itemsByCluster = useMemo(() => {
    const map = {}
    if (!data?.items) return map
    for (const it of data.items) {
      if (!map[it.cluster_id]) map[it.cluster_id] = []
      map[it.cluster_id].push(it)
    }
    return map
  }, [data])

  const sortedClusters = useMemo(() => {
    if (!data?.clusters) return []
    return [...data.clusters].sort((a, b) => b.count - a.count)
  }, [data])

  const toggleCluster = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleDateChange = (e) => {
    setPendingDate(e.target.value)
  }

  const applyDate = () => {
    if (pendingDate && pendingDate !== date && pendingDate <= yesterday) {
      setDate(pendingDate)
    }
  }

  return (
    <div className="cluster-explorer">
      <div className="cluster-toolbar">
        <div className="cluster-toolbar-inner">
          <div className="cluster-toolbar-left">
            <h2 className="cluster-page-title">主題探索</h2>
            <p className="cluster-page-subtitle">
              將每日新聞自動分群，看見當天最受關注的主題。
            </p>
          </div>
          <div className="cluster-toolbar-right">
            <label className="cluster-date-label">
              <span>選擇日期</span>
              <input
                type="date"
                className="cluster-date-input"
                value={pendingDate}
                max={yesterday}
                onChange={handleDateChange}
                onBlur={applyDate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyDate()
                }}
              />
            </label>
            <button
              type="button"
              className="cluster-date-apply"
              onClick={applyDate}
              disabled={pendingDate === date || pendingDate > yesterday}
            >
              載入
            </button>
          </div>
        </div>
      </div>

      <div className="cluster-content">
        {loading && <FunLoader date={date} />}
        {!loading && error && (
          <div className="cluster-error">
            <div className="cluster-error-icon">📭</div>
            <div className="cluster-error-title">載入失敗</div>
            <div className="cluster-error-detail">{error}</div>
          </div>
        )}
        {!loading && !error && data && (
          <>
            <div className="cluster-summary">
              <div className="cluster-summary-stat">
                <div className="cluster-summary-num">{data.total}</div>
                <div className="cluster-summary-label">總新聞數</div>
              </div>
              <div className="cluster-summary-stat">
                <div className="cluster-summary-num">{data.n_clusters}</div>
                <div className="cluster-summary-label">主題群數</div>
              </div>
              <div className="cluster-summary-stat">
                <div className="cluster-summary-num">{data.date}</div>
                <div className="cluster-summary-label">日期</div>
              </div>
            </div>

            <div className="cluster-grid">
              {sortedClusters.map((c) => (
                <ClusterCard
                  key={c.cluster_id}
                  cluster={c}
                  items={itemsByCluster[c.cluster_id] || []}
                  total={data.total}
                  isExpanded={!!expanded[c.cluster_id]}
                  onToggle={() => toggleCluster(c.cluster_id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
