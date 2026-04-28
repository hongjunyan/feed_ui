import { useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = 'https://pm.moneydj.com/djshakespeare'
const STORAGE_KEY = 'feed_ui.running_topic_tasks'
const POLL_INTERVAL_MS = 3000

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    /* ignore */
  }
}

export default function useTopicTasks({ onTaskCompleted } = {}) {
  const [tasks, setTasks] = useState(loadTasks)
  const tasksRef = useRef(tasks)
  const onCompletedRef = useRef(onTaskCompleted)

  useEffect(() => { tasksRef.current = tasks }, [tasks])
  useEffect(() => { onCompletedRef.current = onTaskCompleted }, [onTaskCompleted])

  useEffect(() => {
    saveTasks(tasks)
  }, [tasks])

  const updateTask = useCallback((topic, patch) => {
    setTasks((prev) => {
      const cur = prev[topic]
      if (!cur) return prev
      return { ...prev, [topic]: { ...cur, ...patch } }
    })
  }, [])

  const removeTask = useCallback((topic) => {
    setTasks((prev) => {
      if (!(topic in prev)) return prev
      const next = { ...prev }
      delete next[topic]
      return next
    })
  }, [])

  const pollOnce = useCallback(async (topic, taskId) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/status`)
      if (!res.ok) return
      const json = await res.json()
      updateTask(topic, {
        status: json.status,
        current_node: json.current_node,
        error: json.error,
      })
      if (json.status === 'completed') {
        // notify and remove
        if (onCompletedRef.current) onCompletedRef.current(topic)
        removeTask(topic)
      }
      // failed tasks stay until user dismisses
    } catch {
      /* network blip — try again next tick */
    }
  }, [updateTask, removeTask])

  useEffect(() => {
    const activeTopics = Object.entries(tasksRef.current).filter(
      ([, t]) => t.status !== 'failed'
    )
    if (activeTopics.length === 0) return

    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      await Promise.all(
        Object.entries(tasksRef.current)
          .filter(([, t]) => t.status !== 'failed')
          .map(([topic, t]) => pollOnce(topic, t.task_id))
      )
    }
    // poll immediately on mount/change, then on interval
    tick()
    const id = setInterval(tick, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
    // re-run when the set of topics (keys) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(tasks).join('|'), pollOnce])

  const submitTopic = useCallback(async ({ topic, end }) => {
    const body = { topics: [topic] }
    if (end) body.end = end
    const res = await fetch(`${API_BASE}/workflow/run-topic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `送出失敗 (${res.status})`)
    }
    const json = await res.json()
    setTasks((prev) => ({
      ...prev,
      [topic]: {
        task_id: json.task_id,
        thread_id: json.thread_id,
        status: 'pending',
        current_node: null,
        error: null,
        end,
        started_at: new Date().toISOString(),
      },
    }))
    return json
  }, [])

  const hasRunning = Object.values(tasks).some(
    (t) => t.status !== 'failed'
  )

  return { tasks, submitTopic, removeTask, hasRunning }
}
