jest.mock('../env.ts', () => ({ POI_VERSION: '11.1.0' }))
jest.mock('../debug.ts', () => ({ log: jest.fn(), isEnabled: () => false }))

const mockConfigStore = new Map<string, unknown>()
jest.mock('../config.ts', () => ({
  get: (path: string, fallback?: unknown) =>
    mockConfigStore.has(path) ? mockConfigStore.get(path) : fallback,
  set: (path: string, value: unknown) => mockConfigStore.set(path, value),
}))

import type * as analyticsModule from '../analytics'

type Analytics = typeof analyticsModule

interface CollectedEvent {
  name: string
  params: Record<string, unknown>
}

interface CollectedPayload {
  client_id: string
  user_id?: string
  events: CollectedEvent[]
}

const loadAnalytics = (): Analytics => {
  let mod: Analytics | undefined
  jest.isolateModules(() => {
    mod = require('../analytics')
  })
  if (!mod) {
    throw new Error('analytics module failed to load')
  }
  return mod
}

/** The request body of the nth /mp/collect call. */
const payloadOf = (call: number): CollectedPayload =>
  JSON.parse(String(jest.mocked(global.fetch).mock.calls[call][1]?.body))

const urlOf = (call: number): string => String(jest.mocked(global.fetch).mock.calls[call][0])

describe('analytics (GA4 measurement protocol)', () => {
  beforeEach(() => {
    mockConfigStore.clear()
    process.env.POI_GA_MEASUREMENT_ID = 'G-TESTID0000'
    process.env.POI_GA_API_SECRET = 'test-secret'
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 })
  })

  afterEach(() => {
    delete process.env.POI_GA_MEASUREMENT_ID
    delete process.env.POI_GA_API_SECRET
  })

  it('sends nothing when credentials are absent', () => {
    delete process.env.POI_GA_MEASUREMENT_ID
    delete process.env.POI_GA_API_SECRET
    const analytics = loadAnalytics()
    analytics.init()
    analytics.sendEvent('heartbeat')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sends nothing when the user opted out', () => {
    mockConfigStore.set('poi.misc.analytics', false)
    const analytics = loadAnalytics()
    analytics.init()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('respects an opt-out made after startup, without a restart', () => {
    const analytics = loadAnalytics()
    analytics.init()
    expect(global.fetch).toHaveBeenCalledTimes(1)

    mockConfigStore.set('poi.misc.analytics', false)
    analytics.sendEvent('heartbeat')
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('posts app_start with credentials in the query string', () => {
    const analytics = loadAnalytics()
    analytics.init()

    expect(urlOf(0)).toBe(
      'https://www.google-analytics.com/mp/collect?measurement_id=G-TESTID0000&api_secret=test-secret',
    )
    const payload = payloadOf(0)
    expect(payload.events[0].name).toBe('app_start')
    expect(payload.events[0].params).toMatchObject({
      poi_version: '11.1.0',
      platform: process.platform,
      arch: process.arch,
    })
    // Without these two GA4 drops the event from most reports.
    expect(payload.events[0].params.session_id).toEqual(expect.any(String))
    expect(payload.events[0].params.engagement_time_msec).toBe(1)
  })

  it('generates a client id once and persists it across launches', () => {
    loadAnalytics().init()
    const first = payloadOf(0).client_id
    expect(first).toEqual(expect.any(String))
    expect(mockConfigStore.get('poi.misc.analyticsClientId')).toBe(first)

    jest.mocked(global.fetch).mockClear()
    loadAnalytics().init()
    expect(payloadOf(0).client_id).toBe(first)
  })

  it('attaches the member id as user_id and emits a versioned page_view', () => {
    const analytics = loadAnalytics()
    analytics.setUserId('12345')

    const payload = payloadOf(0)
    expect(payload.user_id).toBe('12345')
    expect(payload.events[0].name).toBe('page_view')
    expect(payload.events[0].params.page_location).toBe('https://analytics.poooi.app/11.1.0/')
    analytics.stopHeartbeat()
  })

  it('ignores a repeated member id so page_view is not double counted', () => {
    const analytics = loadAnalytics()
    analytics.setUserId('12345')
    analytics.setUserId('12345')
    expect(global.fetch).toHaveBeenCalledTimes(1)
    analytics.stopHeartbeat()
  })

  it('sends a heartbeat on an interval once the member id is known', () => {
    jest.useFakeTimers()
    const analytics = loadAnalytics()
    analytics.setUserId('12345')
    jest.mocked(global.fetch).mockClear()

    jest.advanceTimersByTime(240000 * 2)
    const names = jest
      .mocked(global.fetch)
      .mock.calls.map((_call, i) => payloadOf(i).events[0].name)
    expect(names).toEqual(['heartbeat', 'heartbeat'])

    analytics.stopHeartbeat()
    jest.useRealTimers()
  })

  it('swallows network failures', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ENOTFOUND'))
    const analytics = loadAnalytics()
    expect(() => analytics.init()).not.toThrow()
    await Promise.resolve()
  })
})
