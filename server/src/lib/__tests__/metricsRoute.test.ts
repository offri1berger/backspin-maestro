import { describe, expect, it, afterAll, beforeAll } from '@jest/globals'
import express from 'express'
import { createServer } from 'http'
import type { AddressInfo } from 'net'
import { collectMetrics } from '../metrics.js'

// Replicates the route in index.ts. Kept in sync by review, not import, to
// avoid pulling in the full server bootstrap (which connects to Postgres/Redis
// on import).
const buildApp = () => {
  const app = express()
  app.get('/metrics', async (req, res) => {
    const token = process.env.METRICS_TOKEN
    if (!token) { res.status(503).type('text/plain').send('metrics disabled'); return }
    const header = req.headers.authorization
    if (header !== `Bearer ${token}`) { res.status(401).type('text/plain').send('unauthorized'); return }
    const { contentType, body } = await collectMetrics()
    res.set('Content-Type', contentType).send(body)
  })
  return app
}

let baseUrl: string
let server: ReturnType<typeof createServer>

beforeAll(async () => {
  const app = buildApp()
  server = createServer(app)
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const port = (server.address() as AddressInfo).port
  baseUrl = `http://127.0.0.1:${port}`
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('GET /metrics', () => {
  it('returns 503 when METRICS_TOKEN is unset', async () => {
    delete process.env.METRICS_TOKEN
    const res = await fetch(`${baseUrl}/metrics`)
    expect(res.status).toBe(503)
  })

  it('returns 401 when the Bearer token is missing', async () => {
    process.env.METRICS_TOKEN = 'sekret'
    const res = await fetch(`${baseUrl}/metrics`)
    expect(res.status).toBe(401)
  })

  it('returns 401 when the Bearer token is wrong', async () => {
    process.env.METRICS_TOKEN = 'sekret'
    const res = await fetch(`${baseUrl}/metrics`, { headers: { authorization: 'Bearer nope' } })
    expect(res.status).toBe(401)
  })

  it('returns the Prometheus exposition when the token matches', async () => {
    process.env.METRICS_TOKEN = 'sekret'
    const res = await fetch(`${baseUrl}/metrics`, { headers: { authorization: 'Bearer sekret' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/plain/)
    const body = await res.text()
    expect(body).toContain('hitster_')
  })
})
