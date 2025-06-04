'use client';

import React, { useMemo, useState, useEffect } from 'react';

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
  
// Format the JSON string with indentation
  const formattedJson = useMemo(() => {
    try {
      // Detect circular references
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key: string, value: unknown) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular Reference]';
            }
            seen.add(value);
          }
          // Handle other special cases
          if (value === undefined) {
            return 'undefined';
          }
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'function') {
            return '[Function]';
          }
          return value;
        };
      };
      
      // Use a stable stringify with circular reference handling
      return JSON.stringify(data, getCircularReplacer(), 2);
    } catch (error) {
      return `Error formatting JSON: ${error}`;
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
      className={`text-xs font-mono p-2 rounded overflow-auto max-h-60 ${className}`}
      style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
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
        let cls = 'color: var(--color-primary);'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'color: var(--color-foreground); font-weight: bold;'; // key
          } else {
            cls = 'color: var(--color-secondary);'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'color: var(--color-accent);'; // boolean
        } else if (/null|undefined|\[Circular Reference\]|\[Function\]/.test(match)) {
          cls = 'color: var(--color-muted);'; // null, undefined, circular ref
        }
        return `<span style="${cls}">${match}</span>`;
      }
    );
  } catch (error) {
    // Fail gracefully if highlighting encounters an error
    console.error('Error while highlighting JSON:', error);
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
