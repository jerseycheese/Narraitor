import React, { useMemo, useState, useEffect } from 'react';
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
  currentSituation?: string;
  showPrioritizationInfo?: boolean;
}

interface ContextResult {
  context: string;
  estimatedTokenCount: number;
  finalTokenCount: number;
  contextRetentionPercentage: number;
}

export const ContextPreview: React.FC<ContextPreviewProps> = ({
  world,
  character,
  recentEvents,
  tokenLimit = 1000,
  showTokenCount = false,
  showWarning = false,
  promptType = 'narrative',
  currentSituation,
  showPrioritizationInfo = false
}) => {
  const contextManager = useMemo(() => new PromptContextManager(), []);
  const [contextResult, setContextResult] = useState<ContextResult>({
    context: '',
    estimatedTokenCount: 0,
    finalTokenCount: 0,
    contextRetentionPercentage: 100
  });
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const generateContext = async () => {
      setIsLoading(true);
      try {
        const result = await contextManager.generateContext({
          world,
          character,
          recentEvents,
          tokenLimit,
          promptType,
          currentSituation
        });
        setContextResult(result);
      } catch (error) {
        console.error('Error generating context:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateContext();
  }, [contextManager, world, character, recentEvents, tokenLimit, promptType, currentSituation]);

  const { context, estimatedTokenCount, finalTokenCount, contextRetentionPercentage } = contextResult;

  if (isLoading) {
    return <div>Loading context...</div>;
  }

  // Determine if truncation occurred
  const truncationOccurred = contextRetentionPercentage < 100;
  
  // Calculate retention status for visual indicator
  const getRetentionStatus = () => {
    if (contextRetentionPercentage >= 90) return 'high';
    if (contextRetentionPercentage >= 70) return 'medium';
    return 'low';
  };
  
  const retentionStatus = getRetentionStatus();
  
  return (
    <div className="narraitor-context-preview-container space-y-4">
      {showTokenCount && (
        <div className="narraitor-context-preview-metrics p-3 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-800 mb-2">Token Metrics</h3>
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="text-sm">
              <span className="font-medium">Estimated tokens:</span>
              <span className="ml-1">{estimatedTokenCount}</span>
            </div>
            
            <div className="text-sm">
              <span className="font-medium">Final tokens:</span>
              <span className="ml-1">{finalTokenCount} / {tokenLimit}</span>
              {showWarning && finalTokenCount > tokenLimit && (
                <span className="text-red-600 ml-2 font-bold">
                  ⚠️ Limit exceeded
                </span>
              )}
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">Context retention:</span>
              <span className={`font-medium ${
                retentionStatus === 'high' ? 'text-green-600' :
                retentionStatus === 'medium' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {contextRetentionPercentage.toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  retentionStatus === 'high' ? 'bg-green-500' :
                  retentionStatus === 'medium' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(contextRetentionPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          
          {truncationOccurred && showWarning && (
            <div className="text-sm bg-yellow-50 border border-yellow-200 p-2 rounded text-yellow-700">
              <span className="font-bold">⚠️ Truncation applied:</span> Some content was removed to fit within the token limit.
              {contextRetentionPercentage < 50 && (
                <span className="block mt-1">Significant content loss detected. Consider increasing token limit or reducing input content.</span>
              )}
            </div>
          )}
        </div>
      )}

      {showPrioritizationInfo && (
        <div className="narraitor-context-prioritization p-3 border rounded-lg bg-gray-50 mb-4">
          <h3 className="font-medium text-gray-800 mb-2">Prioritization Info</h3>
          <div className="text-sm">
            <p className="mb-1"><span className="font-medium">Prompt Type:</span> {promptType}</p>
            <p className="mb-2">Content is prioritized based on:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Importance weight (by content type and prompt type)</li>
              <li>Recency (more recent content is prioritized)</li>
              <li>Token efficiency (smaller content may be preferred when space is limited)</li>
            </ul>
            
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="font-medium">Content Types:</p>
                <ul className="list-none pl-0">
                  {world && <li>✓ World</li>}
                  {character && <li>✓ Character</li>}
                  {recentEvents && recentEvents.length > 0 && <li>✓ Events ({recentEvents.length})</li>}
                  {currentSituation && <li>✓ Current Situation</li>}
                </ul>
              </div>
              <div>
                <p className="font-medium">Priority Weights:</p>
                <ul className="list-none pl-0">
                  <li>World: {promptType === 'narrative' ? '5' : promptType === 'decision' ? '4' : '4'}</li>
                  <li>Character: {promptType === 'narrative' ? '4' : promptType === 'decision' ? '5' : '3'}</li>
                  <li>Events: {promptType === 'narrative' ? '3' : promptType === 'decision' ? '3' : '5'}</li>
                  <li>Situation: {promptType === 'narrative' ? '4' : promptType === 'decision' ? '5' : '4'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <pre className="narraitor-context-preview-content bg-gray-100 p-4 rounded-lg overflow-x-auto">
        <code className="text-sm">{context}</code>
      </pre>
    </div>
  );
};
