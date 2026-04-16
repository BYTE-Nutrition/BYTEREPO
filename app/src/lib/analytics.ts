/**
 * Thin wrapper around PostHog.
 * Import `analytics` anywhere in the app; it's a no-op if the key is missing.
 */
import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY
const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com'

if (key) {
  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
  })
}

export const analytics = {
  /** Call after sign-in so events are tied to the user. */
  identify(userId: string, email?: string) {
    if (!key) return
    posthog.identify(userId, { email })
  },

  /** Call on sign-out to detach the identity. */
  reset() {
    if (!key) return
    posthog.reset()
  },

  /** Fire a named event with optional properties. */
  track(event: string, properties?: Record<string, unknown>) {
    if (!key) return
    posthog.capture(event, properties)
  },
}
