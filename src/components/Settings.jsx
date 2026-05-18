import React, { useEffect, useState } from 'react'
import './Settings.css'

const API_BASE = 'https://pm.moneydj.com/djshakespeare'

const PROVIDER_OPTIONS = [
  { value: 'all', label: 'ALL（全部）' },
  { value: 'RssNews', label: 'RssNews（RSS 新聞）' },
  { value: 'VipNews', label: 'VipNews（MoneyDJ 新聞）' },
]

const DEFAULTS = {
  num_topics: 5,
  omnithink_search_lookback_days: 90,
  provider: 'RssNews',
}

const TIMEZONE_OPTIONS = [
  'Asia/Taipei',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'UTC',
]

// 0=日, 1=一, ..., 6=六
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

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

// 嘗試把 cron 字串拆解成「白話模式」
// 回傳 { mode, hour, minute, days } 或 { mode: 'custom' }
function parseCron(cron) {
  if (typeof cron !== 'string') return { mode: 'custom' }
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return { mode: 'custom' }
  const [mStr, hStr, dom, mon, dow] = parts

  const m = Number(mStr)
  const h = Number(hStr)
  const validTime =
    Number.isInteger(m) && m >= 0 && m <= 59 &&
    Number.isInteger(h) && h >= 0 && h <= 23

  if (!validTime || dom !== '*' || mon !== '*') return { mode: 'custom' }

  if (dow === '*') {
    return { mode: 'everyday', hour: h, minute: m, days: [0, 1, 2, 3, 4, 5, 6] }
  }
  if (dow === '1-5') {
    return { mode: 'weekdays', hour: h, minute: m, days: [1, 2, 3, 4, 5] }
  }
  // 嘗試解析成數字串列 (e.g. "1,3,5")
  const tokens = dow.split(',').map((t) => t.trim())
  const days = []
  for (const t of tokens) {
    if (/^\d+$/.test(t)) {
      const n = Number(t)
      if (n >= 0 && n <= 6) {
        days.push(n)
        continue
      }
    }
    return { mode: 'custom' }
  }
  return { mode: 'weekly', hour: h, minute: m, days: Array.from(new Set(days)).sort() }
}

function buildCron({ mode, hour, minute, days, customCron }) {
  if (mode === 'custom') return customCron
  const m = Number(minute)
  const h = Number(hour)
  if (mode === 'everyday') return `${m} ${h} * * *`
  if (mode === 'weekdays') return `${m} ${h} * * 1-5`
  if (mode === 'weekly') {
    if (!days || days.length === 0) return `${m} ${h} * * *`
    const sorted = [...days].sort((a, b) => a - b)
    return `${m} ${h} * * ${sorted.join(',')}`
  }
  return customCron
}

function isValidCron(cron) {
  if (typeof cron !== 'string') return false
  const parts = cron.trim().split(/\s+/)
  return parts.length === 5 && parts.every((p) => p.length > 0)
}

function formatNextRun(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

function describeSchedule({ mode, hour, minute, days, customCron }) {
  if (mode === 'custom') return `自訂 cron：${customCron || '（未填寫）'}`
  const hh = String(hour).padStart(2, '0')
  const mm = String(minute).padStart(2, '0')
  const t = `${hh}:${mm}`
  if (mode === 'everyday') return `每天 ${t}`
  if (mode === 'weekdays') return `週一 ~ 週五 ${t}`
  if (mode === 'weekly') {
    if (!days || days.length === 0) return '尚未選擇執行日'
    const labels = [...days].sort((a, b) => a - b).map((d) => `週${WEEKDAY_LABELS[d]}`)
    return `${labels.join('、')} ${t}`
  }
  return ''
}

function Settings() {
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // 排程相關 state
  const [schedule, setSchedule] = useState(null) // GET /schedule 結果
  const [scheduleForm, setScheduleForm] = useState({
    enabled: true,
    mode: 'weekdays', // weekdays | everyday | weekly | custom
    hour: 7,
    minute: 10,
    days: [1, 2, 3, 4, 5],
    customCron: '10 7 * * 1-5',
    timezone: 'Asia/Taipei',
  })
  const [scheduleBusy, setScheduleBusy] = useState(false)
  const [scheduleError, setScheduleError] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  const loadSchedule = async () => {
    try {
      const sched = await api('/schedule')
      setSchedule(sched)
    } catch (e) {
      // 不阻擋整頁載入
      console.warn('載入排程失敗', e)
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api('/settings')
      setSettings(data)
      setForm(data)

      // 初始化排程表單
      const cron = data.schedule_cron || '10 7 * * 1-5'
      const parsed = parseCron(cron)
      setScheduleForm({
        enabled: data.schedule_enabled !== false,
        mode: parsed.mode,
        hour: parsed.mode === 'custom' ? 7 : parsed.hour,
        minute: parsed.mode === 'custom' ? 10 : parsed.minute,
        days:
          parsed.mode === 'custom'
            ? [1, 2, 3, 4, 5]
            : parsed.mode === 'everyday'
            ? [0, 1, 2, 3, 4, 5, 6]
            : parsed.days,
        customCron: cron,
        timezone: data.schedule_timezone || 'Asia/Taipei',
      })

      await loadSchedule()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const isDirty =
    settings &&
    (form.num_topics !== settings.num_topics ||
      form.omnithink_search_lookback_days !== settings.omnithink_search_lookback_days ||
      form.provider !== settings.provider)

  const validate = () => {
    if (!Number.isInteger(Number(form.num_topics)) || Number(form.num_topics) < 1) {
      return 'num_topics 必須是 ≥ 1 的整數'
    }
    if (
      !Number.isInteger(Number(form.omnithink_search_lookback_days)) ||
      Number(form.omnithink_search_lookback_days) < 1
    ) {
      return 'omnithink_search_lookback_days 必須是 ≥ 1 的整數'
    }
    if (!['all', 'RssNews', 'VipNews'].includes(form.provider)) {
      return 'provider 必須是 all、RssNews 或 VipNews'
    }
    return ''
  }

  const handleSave = async () => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = {
        num_topics: Number(form.num_topics),
        omnithink_search_lookback_days: Number(form.omnithink_search_lookback_days),
        provider: form.provider,
      }
      const data = await api('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setSettings(data)
      setForm(data)
      showToast('設定已更新')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleReset = () => {
    if (settings) setForm(settings)
    setError('')
  }

  // === 排程處理 ===
  const currentCron = buildCron(scheduleForm)

  const scheduleIsDirty =
    settings &&
    (scheduleForm.enabled !== (settings.schedule_enabled !== false) ||
      currentCron !== settings.schedule_cron ||
      scheduleForm.timezone !== settings.schedule_timezone)

  const validateSchedule = () => {
    if (scheduleForm.mode === 'custom') {
      if (!isValidCron(scheduleForm.customCron)) {
        return 'cron 表達式必須是 5 個欄位（分 時 日 月 週）'
      }
    } else {
      const h = Number(scheduleForm.hour)
      const m = Number(scheduleForm.minute)
      if (!Number.isInteger(h) || h < 0 || h > 23) return '小時必須在 0–23 之間'
      if (!Number.isInteger(m) || m < 0 || m > 59) return '分鐘必須在 0–59 之間'
      if (scheduleForm.mode === 'weekly' && (!scheduleForm.days || scheduleForm.days.length === 0)) {
        return '請至少選擇一天'
      }
    }
    if (!scheduleForm.timezone) return '請選擇時區'
    return ''
  }

  const handleSaveSchedule = async () => {
    const err = validateSchedule()
    if (err) {
      setScheduleError(err)
      return
    }
    setScheduleBusy(true)
    setScheduleError('')
    try {
      const payload = {
        schedule_enabled: scheduleForm.enabled,
        schedule_cron: currentCron,
        schedule_timezone: scheduleForm.timezone,
      }
      const data = await api('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setSettings(data)
      // 重新拉一次 /schedule 取得新的 next_run_time
      await loadSchedule()
      showToast('排程已更新')
    } catch (e) {
      setScheduleError(e.message)
    } finally {
      setScheduleBusy(false)
    }
  }

  const handleResetSchedule = () => {
    if (!settings) return
    const cron = settings.schedule_cron || '10 7 * * 1-5'
    const parsed = parseCron(cron)
    setScheduleForm({
      enabled: settings.schedule_enabled !== false,
      mode: parsed.mode,
      hour: parsed.mode === 'custom' ? 7 : parsed.hour,
      minute: parsed.mode === 'custom' ? 10 : parsed.minute,
      days:
        parsed.mode === 'custom'
          ? [1, 2, 3, 4, 5]
          : parsed.mode === 'everyday'
          ? [0, 1, 2, 3, 4, 5, 6]
          : parsed.days,
      customCron: cron,
      timezone: settings.schedule_timezone || 'Asia/Taipei',
    })
    setScheduleError('')
  }

  const toggleDay = (d) => {
    const has = scheduleForm.days.includes(d)
    const next = has
      ? scheduleForm.days.filter((x) => x !== d)
      : [...scheduleForm.days, d].sort((a, b) => a - b)
    setScheduleForm({ ...scheduleForm, days: next })
  }

  const handleModeChange = (mode) => {
    setScheduleForm((prev) => {
      let days = prev.days
      if (mode === 'weekdays') days = [1, 2, 3, 4, 5]
      else if (mode === 'everyday') days = [0, 1, 2, 3, 4, 5, 6]
      else if (mode === 'weekly' && (!days || days.length === 0)) days = [1]
      return { ...prev, mode, days }
    })
  }

  if (loading) {
    return (
      <div className="settings-root">
        <div className="settings-loading">載入中…</div>
      </div>
    )
  }

  return (
    <div className="settings-root">
      <div className="settings-container">
        <header className="settings-header">
          <h2>Workflow 設定</h2>
          <p className="settings-subtitle">
            調整新聞 workflow 與 OmniThink 搜尋的執行參數。儲存後立即生效，
            並會清空 <code>/news/clustering</code> 快取。
          </p>
        </header>

        <div className="settings-field">
          <label className="settings-label" htmlFor="num_topics">
          每天會產出的文章數
            <span className="settings-label-hint">num_topics</span>
          </label>
          <input
            id="num_topics"
            type="number"
            min="1"
            step="1"
            className="settings-input"
            value={form.num_topics}
            onChange={(e) => setForm({ ...form, num_topics: e.target.value })}
          />
          <div className="settings-meta">預設 {DEFAULTS.num_topics}，限制 ≥ 1</div>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="omnithink_search_lookback_days">
            搜尋歷史天數
            <span className="settings-label-hint">omnithink_search_lookback_days</span>
          </label>
          <input
            id="omnithink_search_lookback_days"
            type="number"
            min="1"
            step="1"
            className="settings-input"
            value={form.omnithink_search_lookback_days}
            onChange={(e) =>
              setForm({ ...form, omnithink_search_lookback_days: e.target.value })
            }
          />
          <div className="settings-meta">
            預設 {DEFAULTS.omnithink_search_lookback_days}，限制 ≥ 1
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-label" htmlFor="provider">
            新聞來源
            <span className="settings-label-hint">provider</span>
          </label>
          <select
            id="provider"
            className="settings-input"
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="settings-meta">預設 {DEFAULTS.provider}</div>
        </div>

        {error && <div className="settings-error">⚠️ {error}</div>}

        <div className="settings-actions">
          <button
            type="button"
            className="settings-btn-secondary"
            onClick={handleReset}
            disabled={busy || !isDirty}
          >
            還原
          </button>
          <button
            type="button"
            className="settings-btn-primary"
            onClick={handleSave}
            disabled={busy || !isDirty}
          >
            {busy ? '儲存中…' : '儲存設定'}
          </button>
        </div>

        {settings && (
          <div className="settings-current">
            <div className="settings-current-title">目前已儲存</div>
            <pre className="settings-current-body">{JSON.stringify(settings, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* === 排程設定區塊 === */}
      <div className="settings-container settings-section-spacing">
        <header className="settings-header">
          <div className="settings-header-row">
            <h2>排程設定</h2>
            <label className="settings-switch" title="啟用 / 暫停排程">
              <input
                type="checkbox"
                checked={scheduleForm.enabled}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, enabled: e.target.checked })
                }
              />
              <span className="settings-switch-slider" />
              <span className="settings-switch-label">
                {scheduleForm.enabled ? '已啟用' : '已暫停'}
              </span>
            </label>
          </div>
          <p className="settings-subtitle">
            設定每天自動執行 workflow 的時間。儲存後排程會立即重新註冊。
          </p>
        </header>

        <div className="settings-field">
          <label className="settings-label">執行頻率</label>
          <div className="schedule-mode-tabs">
            {[
              { value: 'weekdays', label: '週一 ~ 週五' },
              { value: 'everyday', label: '每天' },
              { value: 'weekly', label: '每週指定幾天' },
              { value: 'custom', label: '自訂 cron' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`schedule-mode-tab ${scheduleForm.mode === opt.value ? 'is-active' : ''}`}
                onClick={() => handleModeChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {scheduleForm.mode === 'weekly' && (
          <div className="settings-field">
            <label className="settings-label">執行日</label>
            <div className="schedule-day-chips">
              {WEEKDAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`schedule-day-chip ${scheduleForm.days.includes(idx) ? 'is-on' : ''}`}
                  onClick={() => toggleDay(idx)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="settings-meta">點擊以切換要執行的星期幾</div>
          </div>
        )}

        {scheduleForm.mode !== 'custom' ? (
          <div className="settings-field">
            <label className="settings-label">執行時間</label>
            <div className="schedule-time-row">
              <input
                type="time"
                className="settings-input schedule-time-input"
                value={`${String(scheduleForm.hour).padStart(2, '0')}:${String(scheduleForm.minute).padStart(2, '0')}`}
                onChange={(e) => {
                  const [hh, mm] = e.target.value.split(':')
                  setScheduleForm({
                    ...scheduleForm,
                    hour: Number(hh) || 0,
                    minute: Number(mm) || 0,
                  })
                }}
              />
              <span className="settings-meta">24 小時制</span>
            </div>
          </div>
        ) : (
          <div className="settings-field">
            <label className="settings-label" htmlFor="custom_cron">
              Cron 表達式
              <span className="settings-label-hint">分 時 日 月 週</span>
            </label>
            <input
              id="custom_cron"
              type="text"
              className="settings-input settings-input-mono"
              value={scheduleForm.customCron}
              onChange={(e) => setScheduleForm({ ...scheduleForm, customCron: e.target.value })}
              placeholder="例如：10 7 * * 1-5"
            />
            <div className="settings-meta">
              範例：<code>10 7 * * 1-5</code>（平日早上 7:10）、
              <code>0 0 * * *</code>（每天午夜）、
              <code>0 * * * *</code>（每小時整點）
            </div>
          </div>
        )}

        <div className="settings-field">
          <label className="settings-label" htmlFor="timezone">
            時區
            <span className="settings-label-hint">timezone</span>
          </label>
          <select
            id="timezone"
            className="settings-input"
            value={scheduleForm.timezone}
            onChange={(e) => setScheduleForm({ ...scheduleForm, timezone: e.target.value })}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div className="schedule-preview">
          <div className="schedule-preview-row">
            <span className="schedule-preview-label">即將套用</span>
            <span className="schedule-preview-value">{describeSchedule(scheduleForm)}</span>
          </div>
          <div className="schedule-preview-row">
            <span className="schedule-preview-label">產生 cron</span>
            <code className="schedule-preview-cron">{currentCron}</code>
          </div>
          <div className="schedule-preview-row">
            <span className="schedule-preview-label">下次執行</span>
            <span className="schedule-preview-value">
              {schedule?.enabled === false
                ? '（排程已暫停）'
                : formatNextRun(schedule?.next_run_time)}
            </span>
          </div>
        </div>

        {scheduleError && <div className="settings-error">⚠️ {scheduleError}</div>}

        <div className="settings-actions schedule-actions">
          <button
            type="button"
            className="settings-btn-secondary"
            onClick={handleResetSchedule}
            disabled={scheduleBusy || !scheduleIsDirty}
          >
            還原
          </button>
          <button
            type="button"
            className="settings-btn-primary"
            onClick={handleSaveSchedule}
            disabled={scheduleBusy || !scheduleIsDirty}
          >
            {scheduleBusy ? '儲存中…' : '儲存排程'}
          </button>
        </div>
      </div>

      {toast && <div className="settings-toast">{toast}</div>}
    </div>
  )
}

export default Settings
