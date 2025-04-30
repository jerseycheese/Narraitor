type AIRequest = unknown;
type AIResponse = unknown;

export class MockGoogleServiceProvider {
  async send(_request: AIRequest): Promise<AIResponse> {
    // Placeholder implementation. Replace with actual AI service integration when available.
void _request;
    throw new Error('Method not implemented.');
  }
}