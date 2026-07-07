import { PostHog } from 'posthog-node'

const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

let posthog: PostHog | null = null

if (posthogApiKey) {
  posthog = new PostHog(posthogApiKey, {
    host: posthogHost,
    // Flush immediately in serverless environments to guarantee event delivery
    flushAt: 1,
    flushInterval: 0,
  })
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ NEXT_PUBLIC_POSTHOG_KEY is not set. Telemetry will be bypassed.')
  }
}

export default posthog

/**
 * Capture server-side custom events with automatic bypass
 */
export function captureEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  if (!posthog) return

  try {
    posthog.capture({
      distinctId,
      event,
      properties,
    })
  } catch (error) {
    console.error(`[PostHog Capture Error] Event: ${event}`, error)
  }
}

/**
 * Shutdown PostHog client gracefully (useful for serverless runtimes)
 */
export async function shutdownPostHog() {
  if (!posthog) return
  try {
    await posthog.shutdown()
  } catch (error) {
    console.error('[PostHog Shutdown Error]', error)
  }
}
