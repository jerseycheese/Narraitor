/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PROVIDER_API_KEY_HEADER, PROVIDER_MODEL_HEADER } from '../providerKeyHeader';
import { resolveModel } from '../resolveModel';
import { DEFAULT_TEXT_MODEL } from '../config';

function requestWith(model?: string, key: string | null = 'byo-key'): NextRequest {
  const headers: Record<string, string> = {};
  if (model) headers[PROVIDER_MODEL_HEADER] = model;
  if (key) headers[PROVIDER_API_KEY_HEADER] = key;
  return new NextRequest('http://localhost/api/x', { headers });
}

describe('resolveModel', () => {
  test('uses the model the player configured', () => {
    expect(resolveModel(requestWith('gemini-2.5-pro'))).toBe('gemini-2.5-pro');
  });

  test('falls back to the default when no model header is present', () => {
    expect(resolveModel(requestWith())).toBe(DEFAULT_TEXT_MODEL);
  });

  test('falls back to the default with no request at all', () => {
    expect(resolveModel()).toBe(DEFAULT_TEXT_MODEL);
  });

  test('rejects a header that could steer the request at another path', () => {
    expect(resolveModel(requestWith('../../models/other:generateContent'))).toBe(
      DEFAULT_TEXT_MODEL
    );
  });

  test('ignores a model sent without a key, which would spend the server env key', () => {
    expect(resolveModel(requestWith('gemini-2.5-pro', null))).toBe(DEFAULT_TEXT_MODEL);
  });
});
