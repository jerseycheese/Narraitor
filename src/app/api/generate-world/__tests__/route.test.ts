/**
 * @jest-environment node
 */

/**
 * Two branches the route owns and the generator does not: the relationship
 * field is meaningless without a reference to relate to, and a generated world
 * missing a name, description or genre is a server failure rather than
 * something to hand back to the wizard.
 */

jest.mock('@/lib/generators/worldGenerator');
jest.mock('@/lib/telemetry/reportServerError');

import { POST } from '../route';
import { generateWorld } from '@/lib/generators/worldGenerator';
import { buildAIRequest } from '../../__tests__/routeHarness';

const mockGenerateWorld = generateWorld as jest.MockedFunction<typeof generateWorld>;

const COMPLETE_WORLD = {
  name: 'Ashfall',
  description: 'A city under permanent snow.',
  genre: 'fantasy',
};

function worldRequest(body: Record<string, unknown>) {
  return buildAIRequest('/api/generate-world', body);
}

describe('/api/generate-world', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateWorld.mockResolvedValue(COMPLETE_WORLD as never);
  });

  it('rejects a relationship sent without a reference, before generating', async () => {
    const response = await POST(worldRequest({ worldRelationship: 'set_within' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Existing setting is required');
    expect(mockGenerateWorld).not.toHaveBeenCalled();
  });

  it('returns the generated world on the happy path', async () => {
    const response = await POST(worldRequest({ worldReference: 'Ashfall' }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe('Ashfall');
  });

  it('defaults the relationship when only a reference is given', async () => {
    await POST(worldRequest({ worldReference: 'Ashfall' }));

    expect(mockGenerateWorld).toHaveBeenCalledWith(
      expect.objectContaining({ relationship: 'inspired_by' }),
      expect.anything()
    );
  });

  it('refuses to return a world missing required fields', async () => {
    mockGenerateWorld.mockResolvedValue({ name: 'Ashfall' } as never);

    const response = await POST(worldRequest({ worldReference: 'Ashfall' }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Generated world data is incomplete');
  });

  it('maps a generator failure to a 500 error response', async () => {
    mockGenerateWorld.mockRejectedValue(new Error('provider exploded'));

    const response = await POST(worldRequest({ worldReference: 'Ashfall' }));

    expect(response.status).toBe(500);
  });
});
