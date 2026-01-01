export class APIError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: any;

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_SERVER_ERROR', details?: any) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export class AuthError extends APIError {
    constructor(message: string = 'Unauthorized', details?: any) {
        super(message, 401, 'UNAUTHORIZED', details);
        this.name = 'AuthError';
    }
}

export class ValidationError extends APIError {
    constructor(message: string = 'Validation Error', details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export interface ErrorContext {
    userId?: string;
    path?: string;
    method?: string;
    [key: string]: any;
}

export function logError(error: unknown, context?: ErrorContext) {
    const timestamp = new Date().toISOString();

    const errorDetails = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: error instanceof APIError ? error.code : undefined,
        statusCode: error instanceof APIError ? error.statusCode : undefined,
        details: error instanceof APIError ? error.details : undefined,
        timestamp,
        ...context
    };

    // In a real production app, you might send this to Sentry, Datadog, etc.
    console.error('[ERROR]', JSON.stringify(errorDetails, null, 2));
}

export function handleApiError(error: unknown) {
    logError(error);

    if (error instanceof APIError) {
        return new Response(
            JSON.stringify({
                error: error.message,
                code: error.code,
                details: error.details
            }),
            { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
        JSON.stringify({
            error: 'Internal Server Error',
            code: 'INTERNAL_SERVER_ERROR'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
}
