import React from 'react'
import './ArticleListItem.css'

function ArticleListItem({ data, isSelected, onClick, compact }) {
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

  return (
    <button
      className={`ali ${isSelected ? 'selected' : ''} ${compact ? 'compact' : ''}`}
      onClick={onClick}
      type="button"
    >
      {topic && <span className="ali-topic">{topic}</span>}
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
