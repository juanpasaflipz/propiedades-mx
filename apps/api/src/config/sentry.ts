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

// Express error handler - Sentry v9 uses different API
export const sentryErrorHandler = (err: any, req: any, res: any, next: any) => {
  // Log error to Sentry
  Sentry.captureException(err);
  
  // Continue to next error handler
  next(err);
};