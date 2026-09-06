/**
 * @jest-environment node
 */

/**
 * The route's own guard is that a character cannot be generated without a world
 * that passes validateWorld. Both rejections have to happen before the
 * generator is reached, since that call is what costs money.
 */

jest.mock('@/lib/generators/characterGenerator');
jest.mock('@/lib/telemetry/reportServerError');

import { POST } from '../route';
import { generateAICharacter } from '@/lib/generators/characterGenerator';
import { buildAIRequest } from '../../__tests__/routeHarness';

const mockGenerateCharacter = generateAICharacter as jest.MockedFunction<
  typeof generateAICharacter
>;

const VALID_WORLD = {
  id: 'world-1',
  name: 'Ashfall',
  description: 'A city under permanent snow.',
  genre: 'fantasy',
  theme: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 20,
    skillPointPool: 20,
  },
  createdAt: '2026-09-05T00:00:00Z',
  updatedAt: '2026-09-05T00:00:00Z',
};

function characterRequest(body: Record<string, unknown>) {
  return buildAIRequest('/api/generate-character', body);
}

describe('/api/generate-character', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateCharacter.mockResolvedValue({ name: 'Wren' } as never);
  });

  it('rejects a request with no world before generating', async () => {
    const response = await POST(characterRequest({ characterType: 'original' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(mockGenerateCharacter).not.toHaveBeenCalled();
  });

  it('rejects a world that fails validation before generating', async () => {
    const response = await POST(
      characterRequest({ world: { name: 'Ashfall' } })
    );

    expect(response.status).toBe(400);
    expect(mockGenerateCharacter).not.toHaveBeenCalled();
  });

  it('returns the generated character on the happy path', async () => {
    const response = await POST(characterRequest({ world: VALID_WORLD }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Wren');
  });

  it('defaults characterType and coerces a non-array existingNames', async () => {
    await POST(
      characterRequest({ world: VALID_WORLD, existingNames: 'not-an-array' })
    );

    expect(mockGenerateCharacter).toHaveBeenCalledWith(
      expect.anything(),
      [],
      undefined,
      'original',
      undefined,
      expect.anything()
    );
  });

  it('maps a generator failure to a 500 error response', async () => {
    mockGenerateCharacter.mockRejectedValue(new Error('provider exploded'));

    const response = await POST(characterRequest({ world: VALID_WORLD }));

    expect(response.status).toBe(500);
  });
});
