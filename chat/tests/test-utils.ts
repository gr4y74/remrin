import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

export function setupGlobalRequest() {
    // Basic polyfills for Request, Headers, Response if missing
    if (typeof global.Headers === 'undefined') {
        // @ts-ignore
        global.Headers = class Headers {
            private map = new Map<string, string>();
            constructor(init?: any) {
                if (init) {
                    if (init instanceof Headers) {
                        init.forEach((v: string, k: string) => this.map.set(k, v));
                    } else if (Array.isArray(init)) {
                        init.forEach(([k, v]) => this.map.set(k, v));
                    } else {
                        Object.entries(init).forEach(([k, v]) => this.map.set(k, v as string));
                    }
                }
            }
            append(key: string, value: string) { this.map.set(key, value); }
            delete(key: string) { this.map.delete(key); }
            get(key: string) { return this.map.get(key) || null; }
            has(key: string) { return this.map.has(key); }
            set(key: string, value: string) { this.map.set(key, value); }
            forEach(callback: any) { this.map.forEach(callback); }
        } as any;
    }

    if (typeof global.Request === 'undefined') {
        // @ts-ignore
        global.Request = class Request {
            url: string;
            method: string;
            headers: Headers;
            body: any;
            constructor(input: string, init?: any) {
                this.url = input;
                this.method = init?.method || 'GET';
                this.headers = new Headers(init?.headers);
                this.body = init?.body;
            }
        } as any;
    }

    if (typeof global.Response === 'undefined') {
        // @ts-ignore
        global.Response = class Response {
            status: number;
            ok: boolean;
            headers: Headers;
            body: any;
            constructor(body?: any, init?: any) {
                this.status = init?.status || 200;
                this.ok = this.status >= 200 && this.status < 300;
                this.headers = new Headers(init?.headers);
                this.body = body;
            }
            async json() {
                return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
            }
            static json(data: any, init?: any) {
                return new Response(JSON.stringify(data), { ...init, headers: { 'content-type': 'application/json' } });
            }
        } as any;
    }

    // Crucial: fetch polyfill
    if (typeof global.fetch === 'undefined') {
        // In Node 18+, fetch is available on globalThis
        if (typeof globalThis.fetch !== 'undefined') {
            // @ts-ignore
            global.fetch = globalThis.fetch;
        } else {
            console.warn('⚠️ global fetch and globalThis.fetch are BOTH undefined. Supabase calls might fail.');
        }
    }
}
