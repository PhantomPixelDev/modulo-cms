const getCsrfToken = (): string => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

interface RequestOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30000;

export class ApiError extends Error {
    constructor(
        public status: number,
        public data: { message?: string; draft?: unknown },
    ) {
        super(data.message || `Request failed: ${status}`);
    }
}

export async function apiRequest<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': getCsrfToken(),
                ...headers,
            },
            credentials: 'same-origin',
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
        });

        if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as { message?: string };
            throw new ApiError(response.status, body);
        }

        return (await response.json()) as T;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    } finally {
        window.clearTimeout(timer);
    }
}

export const apiGet = <T = unknown>(url: string): Promise<T> => apiRequest<T>(url);

export const apiPost = <T = unknown>(url: string, body?: unknown): Promise<T> => apiRequest<T>(url, { method: 'POST', body });

export const apiPut = <T = unknown>(url: string, body?: unknown): Promise<T> => apiRequest<T>(url, { method: 'PUT', body });

export const apiDelete = <T = unknown>(url: string): Promise<T> => apiRequest<T>(url, { method: 'DELETE' });
