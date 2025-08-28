/**
 * Tests for Mock Scenarios System - API Contract Validation
 * Issue #156: These tests verify mock scenarios return proper response formats and behavior
 */

import { MockScenarios, MockScenarioConfig } from '../mockScenarios';

describe('Mock Scenarios System - API Contract Tests', () => {
  let mockScenarios: MockScenarios;

  beforeEach(() => {
    mockScenarios = new MockScenarios();
  });

  describe('Scenario Response Format Validation', () => {
    test('success scenarios return valid AIResponse format', async () => {
      const scenarios = ['success-fast', 'success-slow', 'success-detailed'];
      
      for (const scenarioId of scenarios) {
        const response = await mockScenarios.executeScenario(scenarioId, 'test prompt');
        
        // Must return proper AIResponse structure
        expect(response).toMatchObject({
          content: expect.any(String),
          finishReason: expect.any(String),
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number)
        });
        
        // Content must not be empty for success scenarios
        expect(response.content).toBeTruthy();
        expect(response.content.length).toBeGreaterThan(0);
        
        // Finish reason should indicate success
        expect(['STOP', 'MAX_TOKENS', 'COMPLETED']).toContain(response.finishReason);
      }
    });

    test('error scenarios throw proper AIServiceError format', async () => {
      const errorScenarios = ['error-timeout', 'error-rate-limit', 'error-api-key'];
      
      for (const scenarioId of errorScenarios) {
        await expect(mockScenarios.executeScenario(scenarioId, 'test prompt'))
          .rejects.toMatchObject({
            code: expect.any(String),
            message: expect.any(String),
            retryable: expect.any(Boolean)
          });
      }
    });

    test('mixed scenarios respect success/failure configuration', async () => {
      const mixedConfig: MockScenarioConfig = {
        id: 'mixed-test',
        name: 'Mixed Test Scenario',
        description: 'Sometimes succeeds, sometimes fails',
        successRate: 0.7, // 70% success rate
        responseDelay: 100,
        successResponse: {
          content: 'Success response',
          finishReason: 'STOP',
          promptTokens: 50,
          completionTokens: 100
        },
        errorResponse: {
          code: 'TEST_ERROR',
          message: 'Test failure',
          retryable: true
        }
      };
      
      mockScenarios.addCustomScenario(mixedConfig);
      
      // Run multiple times to test success rate behavior
      const results = await Promise.allSettled(
        Array(20).fill(null).map(() => 
          mockScenarios.executeScenario('mixed-test', 'test prompt')
        )
      );
      
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;
      
      // Should have some successes and some failures (not all one way)
      expect(successes).toBeGreaterThan(0);
      expect(failures).toBeGreaterThan(0);
      expect(successes + failures).toBe(20);
    });
  });

  describe('Response Delay Behavior', () => {
    test('scenarios respect configured delays', async () => {
      const fastConfig: MockScenarioConfig = {
        id: 'delay-test-fast',
        name: 'Fast Response',
        description: 'Quick response for testing',
        successRate: 1.0,
        responseDelay: 50, // 50ms delay
        successResponse: {
          content: 'Fast response',
          finishReason: 'STOP'
        }
      };
      
      const slowConfig: MockScenarioConfig = {
        id: 'delay-test-slow',
        name: 'Slow Response',
        description: 'Slow response for testing',
        successRate: 1.0,
        responseDelay: 2000, // 2 second delay
        successResponse: {
          content: 'Slow response',
          finishReason: 'STOP'
        }
      };
      
      mockScenarios.addCustomScenario(fastConfig);
      mockScenarios.addCustomScenario(slowConfig);
      
      // Test fast response
      const fastStart = Date.now();
      await mockScenarios.executeScenario('delay-test-fast', 'test');
      const fastDuration = Date.now() - fastStart;
      
      // Fast should complete within reasonable time (allowing for test overhead)
      expect(fastDuration).toBeLessThan(200);
      
      // Test slow response
      const slowStart = Date.now();
      await mockScenarios.executeScenario('delay-test-slow', 'test');
      const slowDuration = Date.now() - slowStart;
      
      // Slow should take at least the configured delay
      expect(slowDuration).toBeGreaterThanOrEqual(1800); // Allow some timing tolerance
    });

    test('zero delay scenarios execute immediately', async () => {
      const immediateConfig: MockScenarioConfig = {
        id: 'immediate-test',
        name: 'Immediate Response',
        description: 'No delay response',
        successRate: 1.0,
        responseDelay: 0,
        successResponse: {
          content: 'Immediate response',
          finishReason: 'STOP'
        }
      };
      
      mockScenarios.addCustomScenario(immediateConfig);
      
      const start = Date.now();
      await mockScenarios.executeScenario('immediate-test', 'test');
      const duration = Date.now() - start;
      
      // Should complete very quickly (under 50ms including test overhead)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Success/Failure Rate Behavior', () => {
    test('100% success rate never fails', async () => {
      const alwaysSuccessConfig: MockScenarioConfig = {
        id: 'always-success',
        name: 'Always Success',
        description: 'Never fails',
        successRate: 1.0,
        responseDelay: 10,
        successResponse: {
          content: 'Always succeeds',
          finishReason: 'STOP'
        },
        errorResponse: {
          code: 'SHOULD_NOT_HAPPEN',
          message: 'This should never execute',
          retryable: false
        }
      };
      
      mockScenarios.addCustomScenario(alwaysSuccessConfig);
      
      // Run multiple times - should never fail
      const results = await Promise.allSettled(
        Array(10).fill(null).map(() => 
          mockScenarios.executeScenario('always-success', 'test')
        )
      );
      
      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
    });

    test('0% success rate always fails', async () => {
      const alwaysFailConfig: MockScenarioConfig = {
        id: 'always-fail',
        name: 'Always Fail',
        description: 'Never succeeds',
        successRate: 0.0,
        responseDelay: 10,
        successResponse: {
          content: 'Should not return this',
          finishReason: 'STOP'
        },
        errorResponse: {
          code: 'ALWAYS_FAILS',
          message: 'Configured to always fail',
          retryable: false
        }
      };
      
      mockScenarios.addCustomScenario(alwaysFailConfig);
      
      // Run multiple times - should always fail
      const results = await Promise.allSettled(
        Array(10).fill(null).map(() => 
          mockScenarios.executeScenario('always-fail', 'test')
        )
      );
      
      // All should fail
      results.forEach(result => {
        expect(result.status).toBe('rejected');
        if (result.status === 'rejected') {
          expect(result.reason).toMatchObject({
            code: 'ALWAYS_FAILS',
            message: 'Configured to always fail',
            retryable: false
          });
        }
      });
    });
  });

  describe('Custom Scenario Management', () => {
    test('can add and execute custom scenarios', async () => {
      const customConfig: MockScenarioConfig = {
        id: 'custom-narrative',
        name: 'Custom Narrative Response',
        description: 'User-defined narrative response',
        successRate: 1.0,
        responseDelay: 500,
        successResponse: {
          content: 'The hero ventured into the mysterious forest...',
          finishReason: 'STOP',
          promptTokens: 25,
          completionTokens: 75
        }
      };
      
      mockScenarios.addCustomScenario(customConfig);
      
      const response = await mockScenarios.executeScenario('custom-narrative', 'Generate story');
      
      expect(response).toMatchObject({
        content: 'The hero ventured into the mysterious forest...',
        finishReason: 'STOP',
        promptTokens: 25,
        completionTokens: 75
      });
    });

    test('custom scenarios override built-in scenarios with same ID', async () => {
      // Add custom scenario with ID that might conflict with built-in
      const overrideConfig: MockScenarioConfig = {
        id: 'success-fast', // Same as built-in
        name: 'Custom Fast Response',
        description: 'Override of built-in fast response',
        successRate: 1.0,
        responseDelay: 100,
        successResponse: {
          content: 'Custom override response',
          finishReason: 'STOP'
        }
      };
      
      mockScenarios.addCustomScenario(overrideConfig);
      
      const response = await mockScenarios.executeScenario('success-fast', 'test');
      
      // Should get the custom response, not the built-in one
      expect(response.content).toBe('Custom override response');
    });

    test('throws error for unknown scenarios', async () => {
      await expect(mockScenarios.executeScenario('unknown-scenario', 'test'))
        .rejects.toThrow(/unknown.*scenario.*unknown-scenario/i);
    });
  });

  describe('Response Content Validation', () => {
    test('narrative responses contain story-like content', async () => {
      const response = await mockScenarios.executeScenario('success-detailed', 'Generate narrative');
      
      // Should contain narrative elements
      expect(response.content).toMatch(/\b(you|your|the|a|an)\b/i); // Common story words
      expect(response.content.length).toBeGreaterThan(50); // Substantial content
      expect(response.content).not.toMatch(/^(ok|yes|no|error)$/i); // Not just simple responses
    });

    test('token counts are realistic for response length', async () => {
      const response = await mockScenarios.executeScenario('success-detailed', 'test');
      
      // Token counts should be reasonable relative to content length
      const wordCount = response.content.split(/\s+/).length;
      const expectedTokens = Math.ceil(wordCount * 1.3); // Rough tokens-to-words ratio
      
      if (response.promptTokens && response.completionTokens) {
        expect(response.completionTokens).toBeGreaterThan(0);
        expect(response.completionTokens).toBeLessThan(expectedTokens * 3); // Allow generous range
      }
    });
  });

  describe('Scenario Metadata', () => {
    test('built-in scenarios have complete metadata', () => {
      const builtInScenarios = mockScenarios.getAvailableScenarios();
      
      builtInScenarios.forEach(scenario => {
        expect(scenario).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          successRate: expect.any(Number),
          responseDelay: expect.any(Number)
        });
        
        // Validate success rate range
        expect(scenario.successRate).toBeGreaterThanOrEqual(0);
        expect(scenario.successRate).toBeLessThanOrEqual(1);
        
        // Validate delay is non-negative
        expect(scenario.responseDelay).toBeGreaterThanOrEqual(0);
        
        // Validate required IDs exist
        expect(['success-fast', 'success-slow', 'success-detailed', 'error-timeout', 'error-rate-limit'])
          .toContainEqual(expect.stringContaining(scenario.id));
      });
    });

    test('scenarios provide helpful descriptions for users', () => {
      const scenarios = mockScenarios.getAvailableScenarios();
      
      scenarios.forEach(scenario => {
        // Description should be meaningful and helpful
        expect(scenario.description.length).toBeGreaterThan(10);
        expect(scenario.description).not.toMatch(/^(test|todo|placeholder)$/i);
        expect(scenario.description).toMatch(/[a-z]/); // Should contain actual words
      });
    });
  });
});