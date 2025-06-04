import React from 'react';

export interface AISuggestion {
  id?: string;
  name: string;
  description: string;
  accepted?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AISuggestionsProps {
  suggestions: AISuggestion[];
  onToggle: (index: number) => void;
  onToggleAll?: () => void;
  isProcessing?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  maxSelectable?: number;
  renderSuggestion?: (suggestion: AISuggestion, index: number) => React.ReactNode;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  suggestions,
  onToggle,
  onToggleAll,
  isProcessing = false,
  error = null,
  title = 'AI Suggestions',
  description,
  maxSelectable,
  renderSuggestion,
}) => {
  const acceptedCount = suggestions.filter(s => s.accepted).length;
  const allAccepted = acceptedCount === suggestions.length;
  const someAccepted = acceptedCount > 0 && acceptedCount < suggestions.length;

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4" />
          <p className="text-gray-600">Generating suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">{error}</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No suggestions available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {onToggleAll && (
          <button
            type="button"
            onClick={onToggleAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {allAccepted ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Progress indicator */}
      {maxSelectable && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Selected:</span>
          <span className={`font-medium ${acceptedCount > maxSelectable ? 'text-red-600' : 'text-gray-900'}`}>
            {acceptedCount} / {maxSelectable}
          </span>
          {acceptedCount > maxSelectable && (
            <span className="text-red-600">
              (Please deselect {acceptedCount - maxSelectable} item{acceptedCount - maxSelectable > 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}

      {/* Suggestions list */}
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion.id || index}>
            {renderSuggestion ? (
              renderSuggestion(suggestion, index)
            ) : (
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  suggestion.accepted 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => onToggle(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={suggestion.accepted || false}
                        onChange={() => onToggle(index)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <h4 className="font-medium">{suggestion.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 ml-6">
                      {suggestion.description}
                    </p>
                    {suggestion.metadata && (
                      <div className="mt-2 ml-6 flex flex-wrap gap-2">
                        {Object.entries(suggestion.metadata).map(([key, value]) => (
                          <span 
                            key={key}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toggle all indicator */}
      {onToggleAll && someAccepted && (
        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${(acceptedCount / suggestions.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
};
