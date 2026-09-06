// src/app/api/__tests__/routeHarness.ts

import { NextRequest } from 'next/server';
import {
  PROVIDER_API_KEY_HEADER,
  PROVIDER_MODEL_HEADER,
} from '@/lib/ai/providerKeyHeader';
import type { NarrativeStreamEvent } from '@/lib/ai/types';

/**
 * Shared plumbing for route-tier tests.
 *
 * The only thing faked here is the network. Everything between the HTTP request
 * and `fetch` runs for real: the body-size ceiling, the rate limiter, provider
 * resolution, prompt assembly, the Gemini adapter's own body building and
 * response parsing, the SSE consumer, and the NDJSON encoder. That boundary is
 * deliberate — the adapter's `parseTextResponse` and `parseStreamFrame` are
 * where response-shape defects live, so a fake that replaced the adapter would
 * skip the code most worth watching.
 *
 * Tests using this need `@jest-environment node`. jsdom has no ReadableStream
 * or Response, which the streaming route builds directly.
 */

/**
 * jest.setup.ts sets GEMINI_API_KEY to the MOCK_API_KEY sentinel, which
 * resolveProvider deliberately reads as "no key". Routes therefore only reach a
 * provider when the request carries a key header — the same bring-your-own-key
 * path a real player uses.
 */
const TEST_PROVIDER_KEY = 'test-provider-key';
const TEST_MODEL = 'gemini-2.5-flash';

export interface BuildRequestOptions {
  headers?: Record<string, string>;
  /** Omit the provider key header, to exercise the unresolved-provider path. */
  withoutKey?: boolean;
}

/** A POST carrying a player's key, as the browser client sends it. */
export function buildAIRequest(
  path: string,
  body: unknown,
  options: BuildRequestOptions = {}
): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    [PROVIDER_MODEL_HEADER]: TEST_MODEL,
    ...options.headers,
  };

  if (!options.withoutKey) {
    headers[PROVIDER_API_KEY_HEADER] = TEST_PROVIDER_KEY;
  }

  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/** Stub the upstream provider with a single non-streaming JSON body. */
export function stubUpstreamJson(
  payload: unknown,
  init: { status?: number; statusText?: string } = {}
): jest.Mock {
  const { status = 200, statusText = 'OK' } = init;

  const stub = jest.fn(async () =>
    new Response(JSON.stringify(payload), {
      status,
      statusText,
      headers: { 'Content-Type': 'application/json' },
    })
  );

  global.fetch = stub as unknown as typeof fetch;
  return stub;
}

/** Stub the upstream provider with a non-ok status and an opaque error body. */
export function stubUpstreamFailure(status: number, statusText = 'Error'): jest.Mock {
  const stub = jest.fn(async () =>
    new Response('upstream detail that must not reach the caller', { status, statusText })
  );

  global.fetch = stub as unknown as typeof fetch;
  return stub;
}

/**
 * Stub the upstream provider with an SSE stream.
 *
 * Each frame is emitted as its own chunk so the consumer's partial-line
 * buffering runs on more than one read, which is the condition a single
 * whole-body chunk would never reach.
 */
export function stubUpstreamStream(frames: unknown[]): jest.Mock {
  const stub = jest.fn(async () => {
    const encoder = new TextEncoder();

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const frame of frames) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
        }
        controller.close();
      },
    });

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  });

  global.fetch = stub as unknown as typeof fetch;
  return stub;
}

/** Read a route's NDJSON response back into the events the client would see. */
export async function readNdjsonEvents(response: Response): Promise<NarrativeStreamEvent[]> {
  const raw = await response.text();

  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as NarrativeStreamEvent);
}

/** The request body the adapter sent upstream, for asserting on prompt assembly. */
export function sentUpstreamBody(stub: jest.Mock): Record<string, unknown> {
  const [, init] = stub.mock.calls[0] as [string, { body: string }];
  return JSON.parse(init.body);
}
