import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { buildUrlMap, processContent, buildMdComponents, CiteRefList } from './CiteBadge'
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

  const getTimeSlotClass = (timeSlot) => {
    if (!timeSlot) return ''
    if (timeSlot === '盤前報導') return 'time-slot-pre'
    if (timeSlot === '盤後回顧') return 'time-slot-post'
    if (timeSlot === '晚間報導') return 'time-slot-evening'
    return ''
  }

  const urlMap = useMemo(() => buildUrlMap(metadata?.urls), [metadata?.urls])
  const { processedContent, refNumbers } = useMemo(() => processContent(content), [content])
  const mdComponents = useMemo(() => buildMdComponents(urlMap), [urlMap])

  const algo = metadata?.algo
  const algoConfig = algo ? ALGO_CONFIG[algo] : null

  const renderMetadata = () => {
    if (!metadata || Object.keys(metadata).length === 0) return null

    return (
      <div className="card-metadata">
        {Object.entries(metadata).map(([key, value]) => {
          if (key === 'algo') return null
          if (key === 'urls') {
            return (
              <div key={key} className="metadata-item metadata-item-refs">
                <span className="metadata-label">參考來源</span>
                <CiteRefList refNumbers={refNumbers} urlMap={urlMap} />
              </div>
            )
          }
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
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="metadata-item">
                <span className="metadata-label">{key}:</span>
                <span className="metadata-value">{JSON.stringify(value)}</span>
              </div>
            )
          }
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
        {processedContent ? (
          <div className="card-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {processedContent}
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
