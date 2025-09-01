'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  normalizeTextWithDetails, 
  analyzeText, 
  getWhitespaceStats,
  type TextNormalizationOptions,
  type NormalizationResult,
  type TextAnalysis,
  type WhitespaceStats
} from '@/lib/utils/textNormalization';

/**
 * Props for the TextNormalizationSection component
 */
export interface TextNormalizationSectionProps {
  /** Initial text to load in the component */
  initialText?: string;
  /** Whether to show advanced options */
  showAdvanced?: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * Interactive text normalization component for DevTools
 * 
 * Provides a comprehensive interface for testing and debugging text normalization
 * functionality. Includes live preview, detailed analysis, and export capabilities.
 */
export function TextNormalizationSection({ 
  initialText = '', 
  showAdvanced = true,
  className = ''
}: TextNormalizationSectionProps) {
  const [inputText, setInputText] = useState(initialText);
  const [options, setOptions] = useState<TextNormalizationOptions>({
    normalizeWhitespace: true,
    normalizeLineEndings: true,
    normalizeQuotes: true,
    normalizeSpecialChars: true,
    preserveStructure: true
  });
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Memoized normalization result to avoid recalculation on every render
  const normalizationResult = useMemo<NormalizationResult>(() => {
    return normalizeTextWithDetails(inputText, options);
  }, [inputText, options]);

  // Memoized text analysis
  const textAnalysis = useMemo<TextAnalysis>(() => {
    return analyzeText(inputText);
  }, [inputText]);

  // Memoized whitespace stats
  const whitespaceStats = useMemo<WhitespaceStats>(() => {
    return getWhitespaceStats(inputText);
  }, [inputText]);

  const handleOptionChange = useCallback((optionKey: keyof TextNormalizationOptions) => {
    setOptions(prev => ({
      ...prev,
      [optionKey]: !prev[optionKey]
    }));
  }, []);

  const handleLoadSample = useCallback((sampleType: string) => {
    const samples = {
      whitespace: "Hello    world\t\n   \n\n  This   has   excessive   whitespace.  \n",
      quotes: `He said "Hello world" and she replied 'Good morning'. The "smart quotes" need normalization.`,
      lineEndings: "Windows line ending\r\nMac line ending\rUnix line ending\nMixed endings",
      specialChars: "Em dash—example and en dash–usage plus ellipsis…here",
      complex: `Complex   example with\r\n"smart quotes"—dashes–and…\t\texcessive    spacing.\n\n\n\n\nToo many line breaks.`
    };
    
    setInputText(samples[sampleType as keyof typeof samples] || samples.complex);
  }, []);

  const handleExport = useCallback(() => {
    const exportData = {
      original: inputText,
      normalized: normalizationResult.normalized,
      options,
      changes: normalizationResult.changes,
      stats: normalizationResult.stats,
      analysis: textAnalysis,
      whitespaceStats,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `text-normalization-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [inputText, normalizationResult, options, textAnalysis, whitespaceStats]);

  const handleCopyNormalized = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(normalizationResult.normalized);
      // TODO: Add toast notification when toast system is available
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [normalizationResult.normalized]);

  return (
    <div className={`text-normalization-section space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Text Normalization</h3>
        <div className="flex gap-2 text-sm">
          <button
            onClick={handleExport}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Export
          </button>
          <button
            onClick={handleCopyNormalized}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-700"
          >
            Copy Result
          </button>
        </div>
      </div>

      {/* Sample Data Loader */}
      <div className="bg-gray-100 p-4 rounded">
        <h4 className="font-medium mb-2">Load Sample Data:</h4>
        <div className="flex gap-2 flex-wrap">
          {['whitespace', 'quotes', 'lineEndings', 'specialChars', 'complex'].map(sample => (
            <button
              key={sample}
              onClick={() => handleLoadSample(sample)}
              className="px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-700"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="bg-gray-100 p-4 rounded">
        <h4 className="font-medium mb-3">Normalization Options:</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(options).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleOptionChange(key as keyof TextNormalizationOptions)}
                className="rounded"
              />
              <span className="text-sm">{formatOptionLabel(key)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Input Text */}
      <div>
        <label htmlFor="input-text" className="block text-sm font-medium mb-2">Input Text:</label>
        <textarea
          id="input-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-32 p-3 border rounded font-mono text-sm"
          placeholder="Enter text to normalize..."
        />
        <div className="text-xs text-gray-500 mt-1">
          {textAnalysis.characters} characters, {textAnalysis.words} words, {textAnalysis.lines} lines
        </div>
      </div>

      {/* Normalized Output */}
      <div>
        <label htmlFor="normalized-text" className="block text-sm font-medium mb-2">Normalized Text:</label>
        <textarea
          id="normalized-text"
          value={normalizationResult.normalized}
          readOnly
          className="w-full h-32 p-3 border rounded font-mono text-sm bg-gray-100"
          placeholder="Normalized text will appear here..."
        />
        <div className="text-xs text-gray-500 mt-1">
          {normalizationResult.stats.normalizedLength} characters, 
          {normalizationResult.stats.totalChanges} changes made
          ({normalizationResult.stats.processingTime}ms)
        </div>
      </div>

      {/* Changes Summary */}
      {normalizationResult.changes.length > 0 && (
        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-medium mb-2">Changes Made:</h4>
          <ul className="space-y-1">
            {normalizationResult.changes.map((change, index) => (
              <li key={index} className="text-sm">
                <span className="font-medium">{change.type}:</span> {change.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAdvanced && (
        <>
          {/* Analysis Toggle */}
          <div className="flex gap-4">
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-700"
            >
              {showAnalysis ? 'Hide' : 'Show'} Text Analysis
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-700"
            >
              {showStats ? 'Hide' : 'Show'} Whitespace Stats
            </button>
          </div>

          {/* Text Analysis */}
          {showAnalysis && (
            <div className="bg-amber-200 p-4 rounded">
              <h4 className="font-medium mb-3">Text Analysis:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Structure:</strong>
                  <ul className="ml-4">
                    <li>Characters: {textAnalysis.characters}</li>
                    <li>Words: {textAnalysis.words}</li>
                    <li>Lines: {textAnalysis.lines}</li>
                    <li>Paragraphs: {textAnalysis.paragraphs}</li>
                  </ul>
                </div>
                <div>
                  <strong>Format:</strong>
                  <ul className="ml-4">
                    <li>Line endings: {textAnalysis.lineEndingFormat}</li>
                    <li>Smart quotes: {textAnalysis.hasSmartQuotes ? 'Yes' : 'No'}</li>
                    <li>Special chars: {textAnalysis.hasSpecialChars ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Whitespace Stats */}
          {showStats && (
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-medium mb-3">Whitespace Statistics:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Leading/Trailing:</strong>
                  <ul className="ml-4">
                    <li>Leading spaces: {whitespaceStats.leading}</li>
                    <li>Trailing spaces: {whitespaceStats.trailing}</li>
                  </ul>
                </div>
                <div>
                  <strong>Internal:</strong>
                  <ul className="ml-4">
                    <li>Excessive spaces: {whitespaceStats.excessiveSpaces}</li>
                    <li>Tab characters: {whitespaceStats.tabs}</li>
                    <li>Multiple line breaks: {whitespaceStats.multipleLineBreaks}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Format option key to human-readable label
 */
function formatOptionLabel(key: string): string {
  const labels: Record<string, string> = {
    normalizeWhitespace: 'Normalize Whitespace',
    normalizeLineEndings: 'Normalize Line Endings',
    normalizeQuotes: 'Normalize Quotes',
    normalizeSpecialChars: 'Normalize Special Characters',
    preserveStructure: 'Preserve Structure'
  };
  
  return labels[key] || key;
}

export default TextNormalizationSection;