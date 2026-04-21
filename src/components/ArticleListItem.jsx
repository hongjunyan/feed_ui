import React from 'react'
import './ArticleListItem.css'

const ALGO_CONFIG = {
  OmniThink: { label: 'OmniThink', cls: 'algo-omnithink' },
  STORM:     { label: 'STORM',     cls: 'algo-storm' },
}

function ArticleListItem({ data, isSelected, onClick, compact, topicBand }) {
  const { title, date, metadata, time_slot } = data

  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const d = new Date(dateString)
      return d.toLocaleString('zh-TW', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    } catch {
      return dateString
    }
  }

  const getTimeSlotClass = (ts) => {
    if (ts === '盤前報導') return 'ts-pre'
    if (ts === '盤後回顧') return 'ts-post'
    if (ts === '晚間報導') return 'ts-evening'
    return ''
  }

  const urlCount = Array.isArray(metadata?.urls) ? metadata.urls.length : 0
  const topic = metadata?.topic
  const algo = metadata?.algo
  const algoConfig = algo ? ALGO_CONFIG[algo] : null

  return (
    <button
      className={`ali ${isSelected ? 'selected' : ''} ${compact ? 'compact' : ''} ${algoConfig ? algoConfig.cls : ''} topic-band-${topicBand ?? 0}`}
      onClick={onClick}
      type="button"
    >
      <div className="ali-top-row">
        {topic && <span className="ali-topic">{topic}</span>}
        {algoConfig && (
          <span className={`ali-algo-badge ${algoConfig.cls}`}>{algoConfig.label}</span>
        )}
      </div>
      <h3 className="ali-title">{title || '無標題'}</h3>
      <div className="ali-meta">
        {date && <span className="ali-date">{formatDate(date)}</span>}
        {time_slot && (
          <span className={`ali-slot ${getTimeSlotClass(time_slot)}`}>{time_slot}</span>
        )}
        {urlCount > 0 && (
          <span className="ali-count">{urlCount} 則新聞</span>
        )}
      </div>
    </button>
  )
}

export default ArticleListItem
