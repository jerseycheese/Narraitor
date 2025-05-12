import React, { useMemo } from 'react';
import { PromptContextManager } from '../promptContextManager';
import { WorldContext, CharacterContext } from '../types';

interface ContextPreviewProps {
  world?: WorldContext | null;
  character?: CharacterContext | null;
  recentEvents?: string[];
  tokenLimit?: number;
  showTokenCount?: boolean;
  showWarning?: boolean;
  promptType?: string;
}

export const ContextPreview: React.FC<ContextPreviewProps> = ({
  world,
  character,
  recentEvents,
  tokenLimit = 1000,
  showTokenCount = false,
  showWarning = false,
  promptType = 'narrative'
}) => {
  const contextManager = useMemo(() => new PromptContextManager(), []);
  
  const context = useMemo(() => {
    return contextManager.generateContext({
      world,
      character,
      recentEvents,
      tokenLimit,
      promptType
    });
  }, [contextManager, world, character, recentEvents, tokenLimit, promptType]);
  
  const tokenCount = useMemo(() => {
    // Simple estimation: chars / 4
    return Math.ceil(context.length / 4);
  }, [context]);
  
  return (
    <div className="narraitor-context-preview-container space-y-4">
      {showTokenCount && (
        <div className="narraitor-context-preview-token-count text-sm text-gray-600">
          Estimated tokens: {tokenCount} / {tokenLimit}
          {showWarning && tokenCount > tokenLimit && (
            <span className="text-yellow-600 ml-2">
              ⚠️ Token limit exceeded
            </span>
          )}
        </div>
      )}
      
      <pre className="narraitor-context-preview-content bg-gray-100 p-4 rounded-lg overflow-x-auto">
        <code className="text-sm">{context}</code>
      </pre>
    </div>
  );
};
