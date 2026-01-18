import React from 'react'
import './Card.css'

function Card({ data }) {
  const { title, content, date, metadata } = data

  // 格式化日期顯示
  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // 渲染 metadata
  const renderMetadata = () => {
    if (!metadata || Object.keys(metadata).length === 0) {
      return null
    }

    return (
      <div className="card-metadata">
        {Object.entries(metadata).map(([key, value]) => {
          // 如果值是陣列，顯示為標籤
          if (Array.isArray(value)) {
            return (
              <div key={key} className="metadata-item">
                <span className="metadata-label">{key}:</span>
                <div className="metadata-tags">
                  {value.map((tag, idx) => (
                    <span key={idx} className="metadata-tag">{tag}</span>
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
    <article className="card">
      <header className="card-header">
        <h2 className="card-title">{title || '無標題'}</h2>
        {date && (
          <time className="card-date" dateTime={date}>
            {formatDate(date)}
          </time>
        )}
      </header>
      <div className="card-content">
        {content ? (
          <p className="card-text">{content}</p>
        ) : (
          <p className="card-text card-text-empty">無內容</p>
        )}
      </div>
      {renderMetadata()}
    </article>
  )
}

export default Card
