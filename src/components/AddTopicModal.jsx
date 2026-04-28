import React, { useState, useEffect, useRef } from 'react'
import './AddTopicModal.css'

function getYesterdayISO() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function AddTopicModal({ open, onClose, onSubmit, existingTopics }) {
  const [topic, setTopic] = useState('')
  const [date, setDate] = useState(getYesterdayISO())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)
  const yesterday = getYesterdayISO()

  useEffect(() => {
    if (open) {
      setTopic('')
      setDate(getYesterdayISO())
      setError('')
      setSubmitting(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = topic.trim()
    if (!trimmed) {
      setError('請輸入主題')
      return
    }
    if (existingTopics.has(trimmed)) {
      setError(`主題「${trimmed}」已存在`)
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ topic: trimmed, end: date })
    } catch (err) {
      setError(err?.message || '送出失敗')
      setSubmitting(false)
    }
  }

  return (
    <div className="atm-overlay" onClick={onClose}>
      <div className="atm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="atm-header">
          <h3>加入新主題</h3>
          <button className="atm-close" onClick={onClose} type="button" aria-label="關閉">×</button>
        </div>
        <form className="atm-form" onSubmit={handleSubmit}>
          <label className="atm-field">
            <span>主題</span>
            <input
              ref={inputRef}
              type="text"
              value={topic}
              onChange={(e) => { setTopic(e.target.value); setError('') }}
              placeholder="例如：台積電法說會"
              disabled={submitting}
            />
          </label>
          <label className="atm-field">
            <span>結束日期</span>
            <input
              type="date"
              value={date}
              max={yesterday}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
            />
          </label>
          {error && <div className="atm-error">{error}</div>}
          <div className="atm-actions">
            <button type="button" className="atm-btn atm-btn-secondary" onClick={onClose} disabled={submitting}>
              取消
            </button>
            <button type="submit" className="atm-btn atm-btn-primary" disabled={submitting}>
              {submitting ? '送出中…' : '送出'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTopicModal
