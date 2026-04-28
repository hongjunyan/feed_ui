import React, { useMemo, useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { buildUrlMap, processContent, buildMdComponents, CiteRefList } from './CiteBadge'
import './Card.css'

const WORKFLOW_API_BASE = 'https://pm.moneydj.com/djshakespeare'
const TASK_STORAGE_KEY = 'feed_ui:rewrite_tasks'
const POLL_INTERVAL_MS = 3000

const loadTaskMap = () => {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const saveTaskMap = (map) => {
  try {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

const setTaskForTopic = (topic, taskId) => {
  const map = loadTaskMap()
  if (taskId) map[topic] = taskId
  else delete map[topic]
  saveTaskMap(map)
}

const getTaskForTopic = (topic) => loadTaskMap()[topic] || null

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

const toEndDate = (date) => {
  if (!date) return null
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return null
  }
}

function RerunButton({ topic, articleDate, onCompleted }) {
  const [taskId, setTaskId] = useState(() => (topic ? getTaskForTopic(topic) : null))
  const [status, setStatus] = useState(null) // 'pending' | 'running' | 'completed' | 'failed' | null
  const [currentNode, setCurrentNode] = useState(null)
  const [error, setError] = useState(null)
  const [isStarting, setIsStarting] = useState(false)
  const pollTimerRef = useRef(null)

  useEffect(() => {
    if (!topic) return
    const stored = getTaskForTopic(topic)
    setTaskId(stored)
    setStatus(stored ? 'running' : null)
    setCurrentNode(null)
    setError(null)
  }, [topic])

  useEffect(() => {
    if (!taskId) {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`${WORKFLOW_API_BASE}/tasks/${taskId}/status`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const json = await res.json()
        if (cancelled) return
        setStatus(json.status)
        setCurrentNode(json.current_node || null)
        if (json.status === 'completed') {
          setTaskForTopic(topic, null)
          setTaskId(null)
          if (onCompleted) onCompleted()
          return
        }
        if (json.status === 'failed') {
          setError(json.error || '任務失敗')
          setTaskForTopic(topic, null)
          return
        }
      } catch (err) {
        if (cancelled) return
        setError(err.message || '查詢狀態失敗')
      }
      if (!cancelled) {
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    poll()
    return () => {
      cancelled = true
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [taskId, topic])

  const startTask = async () => {
    if (!topic || isStarting || taskId) return
    setIsStarting(true)
    setError(null)
    setCurrentNode(null)
    try {
      let res = await fetch(`${WORKFLOW_API_BASE}/workflow/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      if (res.status === 404) {
        const body = { topics: [topic] }
        const end = toEndDate(articleDate)
        if (end) body.end = end
        res = await fetch(`${WORKFLOW_API_BASE}/workflow/run-topic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json.task_id) throw new Error('回應缺少 task_id')
      setTaskForTopic(topic, json.task_id)
      setTaskId(json.task_id)
      setStatus('pending')
    } catch (err) {
      setError(err.message || '啟動任務失敗')
    } finally {
      setIsStarting(false)
    }
  }

  if (!topic) return null

  const isRunning = !!taskId && (status === 'pending' || status === 'running' || status === null)
  const disabled = isStarting || isRunning

  let label = '重新執行'
  if (isStarting) label = '啟動中…'
  else if (isRunning) label = currentNode ? `執行中 · ${currentNode}` : '執行中…'

  return (
    <div className="card-rerun">
      <button
        type="button"
        className={`card-rerun-btn ${disabled ? 'is-busy' : ''}`}
        onClick={startTask}
        disabled={disabled}
      >
        {disabled && <span className="card-rerun-spinner" aria-hidden="true" />}
        <span>{label}</span>
      </button>
      {error && <span className="card-rerun-error">⚠ {error}</span>}
    </div>
  )
}

function Card({ data, onTaskCompleted }) {
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
        <div className="card-title-row">
          <h2 className="card-title">{title || '無標題'}</h2>
          <RerunButton topic={metadata?.topic} articleDate={date} onCompleted={onTaskCompleted} />
        </div>
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
