import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

export function setupGlobalRequest() {
    if (typeof global.Request === 'undefined') {
        // @ts-ignore
        global.Request = class Request {
            url: string;
            method: string;
            headers: Headers;
            body: any;
            constructor(input: string | Request, init?: RequestInit) {
                this.url = typeof input === 'string' ? input : input.url;
                this.method = init?.method || 'GET';
                this.headers = new Headers(init?.headers);
                this.body = init?.body;
            }
        } as any;
    }

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

    if (typeof global.Response === 'undefined') {
        // @ts-ignore
        global.Response = class Response {
            status: number;
            ok: boolean;
            headers: Headers;
            body: any;
            constructor(body?: BodyInit | null, init?: ResponseInit) {
                this.status = init?.status || 200;
                this.ok = this.status >= 200 && this.status < 300;
                this.headers = new Headers(init?.headers);
                this.body = body;
            }
            static json(data: any, init?: ResponseInit) {
                const body = JSON.stringify(data);
                const headers = new Headers(init?.headers);
                headers.set('content-type', 'application/json');
                return new Response(body, { ...init, headers });
            }
            async json() {
                return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
            }
        } as any;
    }
}
