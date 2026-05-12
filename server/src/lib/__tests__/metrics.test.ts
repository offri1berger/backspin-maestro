import { describe, expect, it } from '@jest/globals'
import {
  registry,
  jobsCompleted,
  jobsFailed,
  jobsStalled,
  jobDuration,
  deezerFetches,
} from '../metrics.js'

describe('metrics registry', () => {
  it('exposes the prom-client text format', async () => {
    const body = await registry.metrics()
    expect(body).toContain('hitster_jobs_completed_total')
    expect(body).toContain('hitster_deezer_fetch_total')
    expect(body).toContain('hitster_job_duration_seconds')
  })

  it('records counter increments by label', async () => {
    deezerFetches.inc({ result: 'ok' })
    deezerFetches.inc({ result: 'ok' })
    deezerFetches.inc({ result: 'fail' })

    const body = await registry.metrics()
    expect(body).toMatch(/hitster_deezer_fetch_total\{result="ok"} 2/)
    expect(body).toMatch(/hitster_deezer_fetch_total\{result="fail"} 1/)
  })

  it('records job lifecycle counters with the job_name label', async () => {
    jobsCompleted.inc({ job_name: 'steal:fire' })
    jobsFailed.inc({ job_name: 'card-reveal' })
    jobsStalled.inc()

    const body = await registry.metrics()
    expect(body).toMatch(/hitster_jobs_completed_total\{job_name="steal:fire"} 1/)
    expect(body).toMatch(/hitster_jobs_failed_total\{job_name="card-reveal"} 1/)
    expect(body).toMatch(/hitster_jobs_stalled_total 1/)
  })

  it('records histogram observations into buckets', async () => {
    jobDuration.observe({ job_name: 'card-reveal' }, 0.12)
    jobDuration.observe({ job_name: 'card-reveal' }, 0.45)

    const body = await registry.metrics()
    // count of observations should be reflected for that label
    expect(body).toMatch(/hitster_job_duration_seconds_count\{job_name="card-reveal"} 2/)
  })
})
