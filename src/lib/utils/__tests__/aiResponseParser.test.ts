import { parseAIJsonResponse } from '../aiResponseParser';

describe('parseAIJsonResponse', () => {
  it('parses plain fenced JSON responses', () => {
    expect(
      parseAIJsonResponse<{ name: string }>({
        content: '```\n{"name":"Aria"}\n```',
      })
    ).toEqual({ name: 'Aria' });
  });
});
