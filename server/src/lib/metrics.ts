import type { Server } from 'socket.io'
import type { Queue } from 'bullmq'
import { Counter, Gauge, Histogram, Registry } from 'prom-client'
import { getActiveDisconnectGraceCount } from '../socket/disconnectHandler.js'

// Single registry — no default Node.js metrics; we only expose what's actionable.
export const registry = new Registry()

// ── Counters & histograms (recorded by the rest of the codebase) ────────────

export const jobsCompleted = new Counter({
  name: 'hitster_jobs_completed_total',
  help: 'BullMQ jobs that finished successfully',
  labelNames: ['job_name'] as const,
  registers: [registry],
})

export const jobsFailed = new Counter({
  name: 'hitster_jobs_failed_total',
  help: 'BullMQ jobs that threw',
  labelNames: ['job_name'] as const,
  registers: [registry],
})

export const jobsStalled = new Counter({
  name: 'hitster_jobs_stalled_total',
  help: 'BullMQ jobs reported as stalled by the worker',
  registers: [registry],
})

export const jobDuration = new Histogram({
  name: 'hitster_job_duration_seconds',
  help: 'BullMQ worker job processing duration',
  labelNames: ['job_name'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [registry],
})

export const deezerFetches = new Counter({
  name: 'hitster_deezer_fetch_total',
  help: 'Outbound calls to Deezer to refresh a song preview URL',
  labelNames: ['result'] as const, // 'ok' | 'fail'
  registers: [registry],
})

// ── Gauges (computed fresh on each scrape) ──────────────────────────────────

const queueWaiting = new Gauge({ name: 'hitster_queue_waiting', help: 'BullMQ waiting count', registers: [registry] })
const queueActive = new Gauge({ name: 'hitster_queue_active', help: 'BullMQ active count', registers: [registry] })
const queueDelayed = new Gauge({ name: 'hitster_queue_delayed', help: 'BullMQ delayed count', registers: [registry] })
const queueFailed = new Gauge({ name: 'hitster_queue_failed', help: 'BullMQ failed count', registers: [registry] })
const queuePaused = new Gauge({ name: 'hitster_queue_paused', help: 'BullMQ paused count', registers: [registry] })
const socketsConnected = new Gauge({ name: 'hitster_sockets_connected', help: 'Currently connected client sockets', registers: [registry] })
const roomsActive = new Gauge({ name: 'hitster_rooms_active', help: 'Rooms with at least one connected socket on this instance', registers: [registry] })
const disconnectTimers = new Gauge({ name: 'hitster_disconnect_grace_timers', help: 'Players currently in the disconnect grace window', registers: [registry] })

// Room codes are 6 char [A-Z0-9]. Used to distinguish real rooms from each
// socket's auto-joined personal room (which is keyed by socket id).
const ROOM_CODE_RE = /^[A-Z0-9]{6}$/

const countActiveRooms = (io: Server): number => {
  let count = 0
  for (const room of io.sockets.adapter.rooms.keys()) {
    if (ROOM_CODE_RE.test(room)) count++
  }
  return count
}

interface MetricsSources {
  io: Server
  queue: Queue
}

let sources: MetricsSources | null = null

export const setMetricsSources = (s: MetricsSources): void => {
  sources = s
}

/**
 * Pull live values into gauges before serializing. Counters/histograms are
 * already up to date because callers record into them at the event site.
 */
const refreshGauges = async (): Promise<void> => {
  if (!sources) return
  const { io, queue } = sources

  socketsConnected.set(io.sockets.sockets.size)
  roomsActive.set(countActiveRooms(io))
  disconnectTimers.set(getActiveDisconnectGraceCount())

  try {
    const counts = await queue.getJobCounts('waiting', 'active', 'delayed', 'failed', 'paused')
    queueWaiting.set(counts.waiting ?? 0)
    queueActive.set(counts.active ?? 0)
    queueDelayed.set(counts.delayed ?? 0)
    queueFailed.set(counts.failed ?? 0)
    queuePaused.set(counts.paused ?? 0)
  } catch {
    // Redis hiccup — leave previous values; failure shows up via /health
  }
}

export const collectMetrics = async (): Promise<{ contentType: string; body: string }> => {
  await refreshGauges()
  return { contentType: registry.contentType, body: await registry.metrics() }
}
