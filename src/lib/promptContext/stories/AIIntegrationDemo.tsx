import React, { useState, useEffect, useCallback } from 'react';
import { PromptContextManager } from '../promptContextManager';
import { createMockWorld, createMockCharacter } from '../__tests__/test-helpers';

interface TokenMetrics {
  estimatedTokenCount: number;
  finalTokenCount: number;
  contextRetentionPercentage: number;
}

interface AIIntegrationDemoProps {
  testScenario: 'small-world-simple-character' | 'large-world-complex-character' | 
                'multiple-characters' | 'edge-cases' | 'token-monitoring';
  showTokenMetrics?: boolean;
}

export const AIIntegrationDemo: React.FC<AIIntegrationDemoProps> = ({
  testScenario,
  showTokenMetrics = false,
}) => {
  const [context, setContext] = useState<string>('');
  const [metrics, setMetrics] = useState<TokenMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateContextForScenario = useCallback(async () => {
    setIsLoading(true);
    const contextManager = new PromptContextManager();
    
    try {
      let result: {
        context: string;
        estimatedTokenCount: number;
        finalTokenCount: number;
        contextRetentionPercentage: number;
      };
      
      switch (testScenario) {
        case 'small-world-simple-character':
          result = await contextManager.generateContext({
            world: createMockWorld(),
            character: createMockCharacter(),
            tokenLimit: 1000,
          });
          break;
          
        case 'large-world-complex-character':
          const largeWorld = createMockWorld({
            description: 'A vast empire with multiple kingdoms...',
            attributes: Array(6).fill(null).map((_, i) => ({
              id: `attr-${i}`,
              name: `Attr${i}`,
              description: `Desc ${i}`
            })),
          });
          
          const complexCharacter = createMockCharacter({
            attributes: Array(6).fill(null).map((_, i) => ({
              attributeId: `attr-${i}`,
              name: `Attr${i}`,
              value: 5
            })),
          });
          
          result = await contextManager.generateContext({
            world: largeWorld,
            character: complexCharacter,
            tokenLimit: 2000,
          });
          break;
          
        case 'edge-cases':
          result = await contextManager.generateContext({
            world: null,
            character: null,
            tokenLimit: 500,
          });
          break;
          
        default:
          result = await contextManager.generateContext({
            world: createMockWorld(),
            character: createMockCharacter(),
            tokenLimit: 1000,
          });
      }
      
      setContext(result.context);
      setMetrics({
        estimatedTokenCount: result.estimatedTokenCount,
        finalTokenCount: result.finalTokenCount,
        contextRetentionPercentage: result.contextRetentionPercentage,
      });
    } catch (error) {
      console.error('Error generating context:', error);
    } finally {
      setIsLoading(false);
    }
  }, [testScenario]);

  useEffect(() => {
    generateContextForScenario();
  }, [generateContextForScenario]);

  return (
    <div data-testid="ai-integration-demo" className="p-4 max-w-4xl">
      <h3 data-testid="demo-title" className="text-lg font-bold mb-4">
        AI Integration Demo: {testScenario}
      </h3>
      
      {isLoading ? (
        <div data-testid="loading-indicator">Loading...</div>
      ) : (
        <>
          {showTokenMetrics && metrics && (
            <div data-testid="token-metrics" className="mb-4 p-3 bg-gray-100 rounded">
              <h4 className="font-medium mb-2">Token Metrics</h4>
              <div>Estimated Tokens: {metrics.estimatedTokenCount}</div>
              <div>Final Tokens: {metrics.finalTokenCount}</div>
              <div>Retention: {metrics.contextRetentionPercentage.toFixed(1)}%</div>
            </div>
          )}
          
          <div data-testid="context-display" className="border p-3 rounded">
            <h4 className="font-medium mb-2">Generated Context</h4>
            <pre className="whitespace-pre-wrap">{context}</pre>
          </div>
        </>
      )}
    </div>
  );
};
