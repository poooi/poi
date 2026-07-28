// Google Analytics 4, via the Measurement Protocol.
//
// poi previously used Universal Analytics (analytics.js) loaded in the renderer
// from index.html. UA was sunset, and loading gtag.js in a file:// renderer needs
// both a CSP allowance for googletagmanager.com and a cookie-origin override hack.
// Instead we talk to the Measurement Protocol directly from the main process:
// no third-party script, no cookies, and it keeps working behind the game proxy
// (`*.google-analytics.com` is already in the proxy BYPASS_RULES, see lib/proxy.ts).
//
// Caveat inherited from the Measurement Protocol: GA does not synthesise sessions
// or page views for us, so `session_id` and `engagement_time_msec` are attached to
// every event by hand -- without them events are dropped from most GA4 reports.
import { randomUUID } from 'crypto'

import config from './config'
import dbg from './debug'
import { POI_VERSION } from './env'

// Credentials of the poi GA4 property, from
// GA4 Admin -> Data Streams -> (stream) -> Measurement Protocol API secrets.
// Both may be overridden at runtime by POI_GA_MEASUREMENT_ID / POI_GA_API_SECRET.
const MEASUREMENT_ID = 'G-9HGBLSG9YF'
const API_SECRET = 'Ccwwv21XRT-iwjC6hdFLlQ'

const ENDPOINT = 'https://www.google-analytics.com/mp/collect'

// Kept from the UA setup: poi has no real URLs, so page views are reported against
// a synthetic host keyed by version. This is what made the version breakdown legible
// in the old property, so it is worth preserving.
const SYNTHETIC_ORIGIN = 'https://analytics.poooi.app'

const HEARTBEAT_INTERVAL = 240000

// An env var that is set but empty blanks the built-in credential rather than
// falling back to it, which is how a fork or a local build opts out of reporting
// to poi's property. Analytics stays inert while either credential is blank.
const resolveCredential = (override: string | undefined, fallback: string): string =>
  override === undefined ? fallback : override

const measurementId = resolveCredential(process.env.POI_GA_MEASUREMENT_ID, MEASUREMENT_ID)
const apiSecret = resolveCredential(process.env.POI_GA_API_SECRET, API_SECRET)

// GA4 groups events into a session by `session_id`; one poi launch is one session.
const sessionId = String(Date.now())

let clientId: string | undefined
let userId: string | undefined
let heartbeat: NodeJS.Timeout | undefined

interface EventParams {
  [key: string]: string | number | undefined
}

/**
 * The GA4 client id identifies an install, not a person. It is generated locally
 * and persisted so returning-user metrics work across launches.
 */
const getClientId = (): string => {
  if (clientId) {
    return clientId
  }
  const stored = config.get('poi.misc.analyticsClientId')
  if (typeof stored === 'string' && stored) {
    clientId = stored
  } else {
    clientId = randomUUID()
    config.set('poi.misc.analyticsClientId', clientId)
  }
  return clientId
}

const isEnabled = (): boolean =>
  Boolean(measurementId) && Boolean(apiSecret) && config.get('poi.misc.analytics', true)

/**
 * Fire-and-forget a single event. Never throws and never rejects: analytics must
 * not be able to take poi down, and a user with no network is not an error.
 */
export const sendEvent = (name: string, params: EventParams = {}): void => {
  if (!isEnabled()) {
    return
  }

  const payload = {
    client_id: getClientId(),
    ...(userId ? { user_id: userId } : {}),
    events: [
      {
        name,
        params: {
          session_id: sessionId,
          // GA4 discards events with no engagement time; the exact value only
          // affects the "engaged sessions" metric, so report a nominal 1ms.
          engagement_time_msec: 1,
          poi_version: POI_VERSION,
          platform: process.platform,
          arch: process.arch,
          ...params,
        },
      },
    ],
  }

  const url = `${ENDPOINT}?measurement_id=${encodeURIComponent(
    measurementId,
  )}&api_secret=${encodeURIComponent(apiSecret)}`

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      // The collect endpoint answers 204 with an empty body and does not validate
      // the payload. Use /debug/mp/collect by hand when an event fails to show up.
      if (!res.ok) {
        dbg.log(`analytics: ${name} rejected with ${res.status}`)
      }
    })
    .catch((e) => {
      dbg.log(`analytics: ${name} failed`, e)
    })
}

export const stopHeartbeat = (): void => {
  if (heartbeat) {
    clearInterval(heartbeat)
    heartbeat = undefined
  }
}

/**
 * Associate subsequent events with the admiral's member id, mirroring the old
 * `ga('set', 'userId', ...)` call. Sending a page view here is what marks the
 * transition from "poi launched" to "poi in use".
 */
export const setUserId = (id: string | number | undefined): void => {
  const next = id === undefined || id === null || id === '' ? undefined : String(id)
  if (next === userId) {
    return
  }
  userId = next
  if (!userId) {
    // Otherwise the heartbeat keeps firing without a user_id attached, filling
    // GA4 with unattributed events.
    stopHeartbeat()
    return
  }

  sendEvent('page_view', {
    page_location: `${SYNTHETIC_ORIGIN}/${POI_VERSION}/`,
    page_title: `poi ${POI_VERSION}`,
  })

  if (!heartbeat) {
    heartbeat = setInterval(() => sendEvent('heartbeat'), HEARTBEAT_INTERVAL)
    // Do not let the heartbeat keep the process alive on quit.
    heartbeat.unref?.()
  }
}

export const init = (): void => {
  // Deliberately the same gate as every other send: isEnabled() covers both the
  // credentials and the user's consent, so there is only one expression to keep
  // correct as this evolves.
  if (!isEnabled()) {
    dbg.log('analytics: GA4 disabled (no credentials, or the user opted out)')
    return
  }
  sendEvent('app_start')
}
