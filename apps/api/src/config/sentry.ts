import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from './env';

export function initSentry() {
  if (!env.SENTRY_DSN) {
    console.log('Sentry DSN not provided, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [
      // Automatically instrument Node.js libraries and frameworks
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
      // Add profiling integration
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: process.env.COMMIT_SHA || 'unknown',
    // Additional options
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      // Don't send events in test environment
      if (env.NODE_ENV === 'test') {
        return null;
      }
      
      return event;
    },
    // Ignore specific errors
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'Network request failed',
      /^Invalid token/,
    ],
  });

  console.log('✅ Sentry initialized');
}

// Express error handler
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture all 4xx and 5xx errors
    if (error.status && error.status >= 400) {
      return true;
    }
    return true;
  },
});