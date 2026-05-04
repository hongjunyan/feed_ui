import React, { useEffect, useState, useCallback } from 'react'
import './PromptManager.css'

const API_BASE = 'https://pm.moneydj.com/djshakespeare'

const ALLOWED_PROMPTS = [
  'write_news_lead_system',
  'write_news_lead_human',
  'write_article_body_system',
  'write_article_body_human',
]

const PROMPT_LABELS = {
  write_news_lead_system: '新聞導言 · System',
  write_news_lead_human: '新聞導言 · Human',
  write_article_body_system: '文章內文 · System',
  write_article_body_human: '文章內文 · Human',
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`)
  }
  if (res.status === 204) return null
  return res.json()
}

function PromptManager() {
  const [selectedName, setSelectedName] = useState(ALLOWED_PROMPTS[0])
  const [versions, setVersions] = useState([])
  const [productionVersion, setProductionVersion] = useState(null)
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  const loadVersions = useCallback(async (name) => {
    setLoading(true)
    setError('')
    try {
      const [vList, prod] = await Promise.all([
        api(`/prompts/${name}/versions`),
        api(`/prompts/${name}/production`).catch(() => null),
      ])
      setVersions(vList || [])
      setProductionVersion(prod?.version ?? null)

      const targetVersion = prod?.version ?? vList?.[0]?.version ?? null
      if (targetVersion != null) {
        await loadVersionContent(name, targetVersion)
      } else {
        setSelectedVersion(null)
        setContent('')
        setOriginalContent('')
      }
    } catch (e) {
      setError(e.message)
      setVersions([])
      setProductionVersion(null)
      setSelectedVersion(null)
      setContent('')
      setOriginalContent('')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadVersionContent = async (name, version) => {
    try {
      const data = await api(`/prompts/${name}/versions/${version}`)
      setSelectedVersion(version)
      setContent(data.content || '')
      setOriginalContent(data.content || '')
      setCommitMessage('')
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (selectedName) loadVersions(selectedName)
  }, [selectedName, loadVersions])

  const handleSelectVersion = (version) => {
    if (version === selectedVersion) return
    if (content !== originalContent && !confirm('您有未儲存的變更，確定要切換版本嗎？')) return
    loadVersionContent(selectedName, version)
  }

  const handleCommit = async () => {
    if (!content.trim()) {
      setError('Prompt 內容不可為空')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api(`/prompts/${selectedName}`, {
        method: 'PUT',
        body: JSON.stringify({
          content,
          labels: ['latest'],
          commit_message: commitMessage,
        }),
      })
      showToast(`已建立版本 v${result.version}`)
      await loadVersions(selectedName)
      // jump to the newly created version
      if (result?.version) await loadVersionContent(selectedName, result.version)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handlePromote = async (version) => {
    if (!confirm(`確定要將 v${version} 升級為 production 嗎？`)) return
    setBusy(true)
    setError('')
    try {
      await api(`/prompts/${selectedName}/promote`, {
        method: 'POST',
        body: JSON.stringify({ version }),
      })
      showToast(`v${version} 已升級為 production`)
      await loadVersions(selectedName)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (version) => {
    if (!confirm(`確定要刪除 v${version}？此操作無法復原。`)) return
    setBusy(true)
    setError('')
    try {
      await api(`/prompts/${selectedName}/versions/${version}`, { method: 'DELETE' })
      showToast(`v${version} 已刪除`)
      await loadVersions(selectedName)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const isDirty = content !== originalContent

  return (
    <div className="pm-root">
      {/* prompt name list */}
      <aside className="pm-sidebar">
        <div className="pm-sidebar-header">Prompt 清單</div>
        {ALLOWED_PROMPTS.map((name) => (
          <button
            key={name}
            type="button"
            className={`pm-name-item ${selectedName === name ? 'pm-name-active' : ''}`}
            onClick={() => {
              if (isDirty && !confirm('您有未儲存的變更，確定要切換 prompt 嗎？')) return
              setSelectedName(name)
            }}
          >
            <span className="pm-name-label">{PROMPT_LABELS[name]}</span>
            <span className="pm-name-key">{name}</span>
          </button>
        ))}
      </aside>

      {/* version list */}
      <section className="pm-versions">
        <div className="pm-versions-header">
          <span>版本歷史</span>
          {loading && <span className="pm-versions-loading">載入中…</span>}
        </div>
        <div className="pm-versions-list">
          {versions.length === 0 && !loading && (
            <div className="pm-empty">尚無版本</div>
          )}
          {versions.map((v) => {
            const isProd = v.labels?.includes('production')
            const isSelected = v.version === selectedVersion
            return (
              <div
                key={v.version}
                className={`pm-version-item ${isSelected ? 'pm-version-active' : ''}`}
                onClick={() => handleSelectVersion(v.version)}
              >
                <div className="pm-version-row">
                  <span className="pm-version-num">v{v.version}</span>
                  <div className="pm-version-tags">
                    {(v.labels || []).map((label) => (
                      <span
                        key={label}
                        className={`pm-tag ${label === 'production' ? 'pm-tag-prod' : ''}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                {v.updated_at && (
                  <div className="pm-version-time">
                    {new Date(v.updated_at).toLocaleString('zh-TW', { hour12: false })}
                  </div>
                )}
                {v.commit_message && (
                  <div className="pm-version-msg">{v.commit_message}</div>
                )}
                <div className="pm-version-actions">
                  {!isProd && (
                    <button
                      type="button"
                      className="pm-mini-btn"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePromote(v.version)
                      }}
                    >
                      升為 Production
                    </button>
                  )}
                  {!isProd && (
                    <button
                      type="button"
                      className="pm-mini-btn pm-mini-btn-danger"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(v.version)
                      }}
                    >
                      刪除
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* editor */}
      <section className="pm-editor">
        <div className="pm-editor-header">
          <div className="pm-editor-title">
            {PROMPT_LABELS[selectedName]}
            {selectedVersion != null && (
              <span className="pm-editor-version">
                編輯基底：v{selectedVersion}
                {productionVersion === selectedVersion && (
                  <span className="pm-tag pm-tag-prod" style={{ marginLeft: 6 }}>
                    production
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="pm-editor-meta">
            {productionVersion != null && (
              <span>目前 production：v{productionVersion}</span>
            )}
          </div>
        </div>

        <textarea
          className="pm-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="在此編輯 prompt 內容，支援 Langfuse {{var}} Mustache 語法…"
          spellCheck={false}
        />

        <div className="pm-commit-row">
          <input
            type="text"
            className="pm-commit-input"
            placeholder="Commit message（選填，描述本次修改）"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
          />
          <button
            type="button"
            className="pm-primary-btn"
            disabled={busy || !isDirty}
            onClick={handleCommit}
          >
            {busy ? '處理中…' : '建立新版本'}
          </button>
        </div>

        {error && <div className="pm-error">⚠️ {error}</div>}
        {isDirty && !error && (
          <div className="pm-hint">內容已修改，尚未儲存。</div>
        )}
      </section>

      {toast && <div className="pm-toast">{toast}</div>}
    </div>
  )
}

export default PromptManager
