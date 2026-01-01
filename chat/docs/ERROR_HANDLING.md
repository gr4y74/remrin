# Error Handling & Logging Guide

## Overview
This project uses a centralized error handling strategy to ensure robust production monitoring and a consistent user experience.

## Backend Error Handling

### Custom Error Classes
Located in `@/lib/errors/index.ts`.

- **APIError**: Base class for API errors.
  - `statusCode`: HTTP status code (default 500).
  - `code`: Machine-readable error code (e.g., `INTERNAL_SERVER_ERROR`).
  - `details`: Optional extra data.
- **AuthError**: 401 Unauthorized errors.
- **ValidationError**: 400 Bad Request errors.

### API Routes
Wrap all API route handlers or critical logic blocks with `handleApiError`:

```typescript
import { handleApiError, APIError } from "@/lib/errors"

export async function GET() {
  try {
    // ... logic
    throw new APIError("Resource not found", 404, "NOT_FOUND")
  } catch (error) {
    return handleApiError(error)
  }
}
```

This ensures the response is always JSON with `{ error, code, details }` and the error is logged.

### Logging
Use `logError(error, context)` to log errors. In the future, this function can be connected to a service like Sentry or Datadog.

## Frontend Error Handling

### Error Boundary
Wrap page content or major components in `<ErrorBoundary>` to catch React rendering errors and show a "Retry" UI.

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary"

// ...
<ErrorBoundary fallback={<MyCustomFallback />}>
  <ComponentThatMightFail />
</ErrorBoundary>
```

### Network Requests
Use `fetchWithRetry` from `@/lib/fetcher.ts` for robust API calls.
- Automatically retries on 429 (Rate Limit) and 5xx (Server Error).
- Exponential backoff.

```typescript
import { fetchWithRetry } from "@/lib/fetcher"

await fetchWithRetry("/api/resource")
```

### Toast Notifications
Use the helper from `@/lib/errors/toast-helper.ts` to show consistent error messages.

```typescript
import { showErrorToast, showSuccessToast } from "@/lib/errors/toast-helper"

try {
  // ...
} catch (error) {
  showErrorToast("Failed to save settings", { description: error.message })
}
```

## Best Practices
1. **Never expose sensitive info**: The `APIError` message is sent to the client. Keep it user-friendly. Log sensitive details using `logError`.
2. **Context**: Always pass context (userId, resourceId) to `logError` when possible.
3. **Graceful UI**: Use Loading states and Error Boundaries so the entire app doesn't crash.
