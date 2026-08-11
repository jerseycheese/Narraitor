'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { sanitizeForSerialization } from '@/lib/utils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('JsonViewer');

/**
 * JsonViewer props
 */
interface JsonViewerProps {
  /** Data to display */
  data: unknown;
  /** Optional additional class names */
  className?: string;
}

/**
 * JsonViewer Component
 * 
 * A component for displaying JSON data in a formatted, readable way.
 * Used to visualize state data in the DevTools panel.
 * 
 * This component uses client-side only rendering to avoid hydration mismatches
 * between server and client rendering of complex JSON structures.
 */
export const JsonViewer = ({ data, className = '' }: JsonViewerProps) => {
  // State to track if the component is mounted (client-side only)
  const [isMounted, setIsMounted] = useState(false);
  
// Format the JSON string with indentation using enhanced serialization
  const formattedJson = useMemo(() => {
    try {
      // Use the enhanced sanitization utility for consistent handling
      const sanitized = sanitizeForSerialization(data, {
        maxDepth: 8, // Reasonable depth for DevTools display
        functionHandler: (fn) => `[Function: ${fn.name || 'anonymous'}]`
      });
      
      // Format with indentation
      return JSON.stringify(sanitized, null, 2);
    } catch (error) {
      return `Error formatting JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }, [data]);

  // Style the JSON with syntax highlighting using CSS classes
  const styledJson = useMemo(() => {
    if (!isMounted) return ''; // Return empty content if not mounted
    return syntaxHighlight(formattedJson);
  }, [formattedJson, isMounted]);

  // Set mounted state after component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Render a simple pre element during server-side rendering
  // and replace with highlighted content on the client
  return (
    <pre
      data-testid="json-viewer"
      className={`${className}`}
    >
      {!isMounted ? (
        // Simple content for server-side rendering
        'Loading JSON...'
      ) : (
        // Render with dangerouslySetInnerHTML only on the client
        <div dangerouslySetInnerHTML={{ __html: styledJson }} />
      )}
    </pre>
  );
};

/**
 * Apply syntax highlighting to a JSON string
 * This function runs on client-side only to avoid hydration mismatches
 */
function syntaxHighlight(json: string): string {
  if (!json) return '';
  
  try {
    // Apply safety encoding first to prevent XSS
    const sanitized = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Apply syntax highlighting with regex
    return sanitized.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null|undefined|\[Circular Reference\])\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
      (match) => {
        let cls = 'color: var(--color-accent);'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'color: var(--color-text-primary); font-weight: 600;'; // key
          } else {
            cls = 'color: hsl(var(--success-text));'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'color: hsl(var(--warning-text));'; // boolean
        } else if (/null|undefined|\[Circular Reference\]|\[Function[^\]]*\]/.test(match)) {
          cls = 'color: var(--color-text-muted);'; // null, undefined, circular ref, functions
        }
        return `<span style="${cls}">${match}</span>`;
      }
    );
  } catch (error) {
    // Skip syntax highlighting if it throws, and fall back to escaped plain text
    logger.error('Error while highlighting JSON:', error);
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
