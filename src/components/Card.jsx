import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Card.css'

const ALGO_CONFIG = {
  OmniThink: {
    cls: 'algo-omnithink',
    label: 'OmniThink',
    description: '',
  },
  STORM: {
    cls: 'algo-storm',
    label: 'STORM',
    description: '',
  },
}

function Card({ data }) {
  const { title, content, date, metadata, time_slot } = data

  // 格式化日期顯示
  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    } catch {
      return dateString
    }
  }

  // 獲取時段標籤的類型
  const getTimeSlotClass = (timeSlot) => {
    if (!timeSlot) return ''
    if (timeSlot === '盤前報導') return 'time-slot-pre'
    if (timeSlot === '盤後回顧') return 'time-slot-post'
    if (timeSlot === '晚間報導') return 'time-slot-evening'
    return ''
  }

  // 渲染 URLs
  const renderUrls = (urls) => {
    if (!Array.isArray(urls) || urls.length === 0) return null

    return (
      <div className="metadata-links">
        {urls.map((item, idx) => {
          // 支援 [title, url] 格式
          if (Array.isArray(item) && item.length >= 2) {
            const [linkTitle, linkUrl] = item
            return (
              <a 
                key={idx} 
                href={linkUrl} 
                className="metadata-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {linkTitle}
              </a>
            )
          }
          // 支援 {title, url} 格式
          if (typeof item === 'object' && item !== null && item.title && item.url) {
            return (
              <a 
                key={idx} 
                href={item.url} 
                className="metadata-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.title}
              </a>
            )
          }
          return null
        })}
      </div>
    )
  }

  const algo = metadata?.algo
  const algoConfig = algo ? ALGO_CONFIG[algo] : null

  // 渲染 metadata
  const renderMetadata = () => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return null
    }

    return (
      <div className="card-metadata">
        {Object.entries(metadata).map(([key, value]) => {
          // 隱藏 algo 欄位（已在 header 呈現）
          if (key === 'algo') return null
          // 特別處理 urls 欄位
          if (key === 'urls') {
            return (
              <div key={key} className="metadata-item">
                <span className="metadata-label">{key}:</span>
                {renderUrls(value)}
              </div>
            )
          }
          // 如果值是陣列，顯示為標籤
          if (Array.isArray(value)) {
            return (
              <div key={key} className="metadata-item">
                <span className="metadata-label">{key}:</span>
                <div className="metadata-tags">
                  {value.map((tag, idx) => (
                    <span key={idx} className="metadata-tag">{String(tag)}</span>
                  ))}
                </div>
              </div>
            )
          }
          // 如果值是物件，遞迴顯示
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="metadata-item">
                <span className="metadata-label">{key}:</span>
                <span className="metadata-value">{JSON.stringify(value)}</span>
              </div>
            )
          }
          // 一般值
          return (
            <div key={key} className="metadata-item">
              <span className="metadata-label">{key}:</span>
              <span className="metadata-value">{String(value)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <article className={`card ${algoConfig ? algoConfig.cls : ''}`}>
      {algoConfig && (
        <div className={`card-algo-banner ${algoConfig.cls}`}>
          <span className="card-algo-icon" aria-hidden="true">
            {algoConfig.cls === 'algo-omnithink' ? '◉' : '⚡'}
          </span>
          <span className="card-algo-name">{algoConfig.label}</span>
          <span className="card-algo-desc">{algoConfig.description}</span>
        </div>
      )}
      <header className="card-header">
        <h2 className="card-title">{title || '無標題'}</h2>
        <div className="card-date-row">
          {date && (
            <time className="card-date" dateTime={date}>
              {formatDate(date)}
            </time>
          )}
          {time_slot && (
            <span className={`time-slot-tag ${getTimeSlotClass(time_slot)}`}>
              {time_slot}
            </span>
          )}
        </div>
      </header>
      <div className="card-content">
        {content ? (
          <div className="card-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="card-text card-text-empty">無內容</p>
        )}
      </div>
      {renderMetadata()}
    </article>
  )
}

export default Card
