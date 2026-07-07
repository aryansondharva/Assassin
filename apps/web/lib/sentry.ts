import * as Sentry from '@sentry/nextjs'

const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

let isSentryEnabled = false

if (sentryDsn) {
  isSentryEnabled = true
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Sentry DSN is not set. Error reporting will be bypassed.')
  }
}

export default Sentry

/**
 * Report an error to Sentry with optional severity and contexts
 */
export function captureException(error: unknown, extraContexts?: Record<string, any>) {
  if (!isSentryEnabled) {
    console.error('[Sentry Bypassed Exception]', error, extraContexts)
    return
  }

  try {
    Sentry.captureException(error, {
      extra: extraContexts,
    })
  } catch (err) {
    console.error('Failed to capture exception in Sentry:', err)
  }
}

/**
 * Log a message/warning to Sentry
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  extraContexts?: Record<string, any>
) {
  if (!isSentryEnabled) {
    console.log(`[Sentry Bypassed Message] Level: ${level} - ${message}`, extraContexts)
    return
  }

  try {
    Sentry.captureMessage(message, {
      level,
      extra: extraContexts,
    })
  } catch (err) {
    console.error('Failed to capture message in Sentry:', err)
  }
}
