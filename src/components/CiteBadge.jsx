import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import './CiteBadge.css'

const REF_RE = /\[\[([0-9a-f]{8})\]\]/g

/** Build ref_code -> { title, url, date } from [[ref_code, title, url, date?]] */
export function buildUrlMap(urls) {
  const map = {}
  if (!Array.isArray(urls)) return map
  for (const item of urls) {
    if (Array.isArray(item) && item.length >= 3) {
      const [code, title, url, date] = item
      map[code] = { title, url, date: date ?? null }
    }
  }
  return map
}

/**
 * Replace [[ref_code]] in content with markdown link sentinels [N](__cite__code__).
 * Returns { processedContent, refNumbers } where refNumbers maps code -> sequential int.
 */
export function processContent(content) {
  if (!content) return { processedContent: '', refNumbers: {} }
  const nums = {}
  let counter = 1
  REF_RE.lastIndex = 0
  const processedContent = content.replace(REF_RE, (_, code) => {
    if (!nums[code]) nums[code] = counter++
    return `[${nums[code]}](__cite__${code}__)`
  })
  return { processedContent, refNumbers: nums }
}

/** ReactMarkdown `components` object: intercepts cite sentinels, passes real links through */
export function buildMdComponents(urlMap) {
  return {
    a({ href, children, ...props }) {
      if (href && href.startsWith('__cite__')) {
        const code = href.slice(8).replace(/__$/, '')
        return <CiteBadge code={code} n={Number(String(children))} urlMap={urlMap} />
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      )
    },
  }
}

/** Inline superscript citation badge with click-to-reveal portal popover */
export function CiteBadge({ n, code, urlMap }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const urlData = urlMap[code]

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2,
      })
    }
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      const insideTrigger = triggerRef.current?.contains(e.target)
      const insidePopover = popoverRef.current?.contains(e.target)
      if (!insideTrigger && !insidePopover) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!urlData) {
    return <sup className="cite-badge cite-badge-unknown">{n}</sup>
  }

  return (
    <>
      <sup
        ref={triggerRef}
        className={`cite-badge${open ? ' cite-badge-open' : ''}`}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
        aria-expanded={open}
        aria-label={`參考來源 ${n}`}
      >
        {n}
      </sup>
      {open && ReactDOM.createPortal(
        <span
          ref={popoverRef}
          className="cite-popover"
          role="tooltip"
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            transform: 'translateX(-50%) translateY(calc(-100% - 6px))',
          }}
        >
          <a
            href={urlData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cite-popover-link"
          >
            <span className="cite-popover-arrow">↗</span>
            <span className="cite-popover-body">
              <span className="cite-popover-title">{urlData.title}</span>
              {urlData.date && (
                <span className="cite-popover-date">{urlData.date}</span>
              )}
            </span>
          </a>
        </span>,
        document.body
      )}
    </>
  )
}

/** Numbered reference list rendered at the bottom of an article */
export function CiteRefList({ refNumbers, urlMap }) {
  const orderedRefs = Object.entries(refNumbers).sort(([, a], [, b]) => a - b)
  if (orderedRefs.length === 0) return null
  return (
    <ol className="cite-ref-list">
      {orderedRefs.map(([code, n]) => {
        const urlData = urlMap[code]
        if (!urlData) return null
        return (
          <li key={code} className="cite-ref-item">
            <span className="cite-ref-n">{n}</span>
            <span className="cite-ref-body">
              <a
                href={urlData.url}
                className="cite-ref-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {urlData.title}
              </a>
              {urlData.date && (
                <span className="cite-ref-date">{urlData.date}</span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
