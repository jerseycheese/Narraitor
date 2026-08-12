/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PROVIDER_MODEL_HEADER } from '../providerKeyHeader';
import { resolveModel } from '../resolveModel';
import { DEFAULT_TEXT_MODEL } from '../config';

function requestWithModel(model?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (model) headers[PROVIDER_MODEL_HEADER] = model;
  return new NextRequest('http://localhost/api/x', { headers });
}

describe('resolveModel', () => {
  test('uses the model the player configured', () => {
    expect(resolveModel(requestWithModel('gemini-2.5-pro'))).toBe('gemini-2.5-pro');
  });

  test('falls back to the default when no model header is present', () => {
    expect(resolveModel(requestWithModel())).toBe(DEFAULT_TEXT_MODEL);
  });

  test('falls back to the default with no request at all', () => {
    expect(resolveModel()).toBe(DEFAULT_TEXT_MODEL);
  });

  test('rejects a header that could steer the request at another path', () => {
    expect(resolveModel(requestWithModel('../../models/other:generateContent'))).toBe(
      DEFAULT_TEXT_MODEL
    );
  });
});
