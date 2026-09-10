/**
 * fetch is a global on every platform this package runs on — the browser,
 * React Native, and Node ≥18 — so it needs no adapter. But the package's
 * tsconfig deliberately compiles without the DOM lib so that a stray `window`
 * or `localStorage` becomes a type error. These are the fetch globals the
 * moved Open Library code relies on, declared here and nothing more: no
 * Window, no document, no localStorage.
 */
declare function fetch(
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    body?: string;
  },
): Promise<Response>;

interface Response {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

declare class AbortController {
  readonly signal: AbortSignal;
  abort(): void;
}

interface AbortSignal {
  readonly aborted: boolean;
}