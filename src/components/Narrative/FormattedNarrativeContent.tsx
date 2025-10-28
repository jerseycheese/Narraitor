import React from 'react';
import { safeTrim } from '@/lib/utils';
import { useChunkedContent, type UseChunkedContentOptions } from '@/hooks/useChunkedContent';
import { ChunkRevealButton } from './ChunkRevealButton';

interface FormattedNarrativeContentProps {
  content: string;
  className?: string;
  highlightTerms?: string[];
  highlightClassName?: string;
  /** Enable progressive disclosure with chunking */
  enableChunking?: boolean;
  /** Options for chunking behavior */
  chunkingOptions?: UseChunkedContentOptions;
  /** Custom text for reveal button */
  revealButtonText?: string;
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const FormattedNarrativeContent: React.FC<
  FormattedNarrativeContentProps
> = ({
  content,
  className,
  highlightTerms,
  highlightClassName,
  enableChunking = false,
  chunkingOptions,
  revealButtonText,
}) => {
  const normalizedContent = typeof content === 'string' ? content : '';
  const trimmedContent = safeTrim(normalizedContent);

  // Use chunking hook if enabled
  const {
    visibleChunks,
    hasMore,
    revealNext,
    totalCount,
  } = useChunkedContent(
    enableChunking ? trimmedContent : '',
    chunkingOptions || { revealAll: !enableChunking }
  );

  // Determine which content to display
  // Preserve original formatting by slicing the original string instead of joining chunks
  const contentToDisplay = enableChunking && visibleChunks.length > 0
    ? trimmedContent.substring(0, visibleChunks[visibleChunks.length - 1].endIndex)
    : trimmedContent;

  const paragraphs = React.useMemo(() => {
    if (!contentToDisplay) {
      return [];
    }
    return contentToDisplay
      .split(/(?:\n\s*){2,}/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }, [contentToDisplay]);

  const normalizedHighlightTerms = React.useMemo(() => {
    if (!highlightTerms || highlightTerms.length === 0) {
      return [];
    }

    const uniqueTerms = new Map<
      string,
      { pattern: RegExp; key: string; length: number }
    >();

    const addTerm = (term: string) => {
      const cleaned = safeTrim(term).replace(/\s+/g, ' ');
      if (!cleaned) {
        return;
      }
      const key = cleaned.toLowerCase();
      if (uniqueTerms.has(key)) {
        return;
      }

      const pattern = new RegExp(escapeRegExp(cleaned), 'gi');
      uniqueTerms.set(key, {
        pattern,
        key,
        length: cleaned.length,
      });
    };

    highlightTerms.forEach(addTerm);

    return Array.from(uniqueTerms.values()).sort(
      (a, b) => b.length - a.length
    );
  }, [highlightTerms]);

  const highlightClass =
    highlightClassName ||
    'font-semibold text-primary bg-primary/10 ring-1 ring-primary/20 rounded-sm px-1 py-0.5';

  const renderHighlightedNodes = React.useCallback(
    (text: string, keyBase: string): React.ReactNode[] => {
      if (!text) {
        return [];
      }

      if (normalizedHighlightTerms.length === 0) {
        return [
          <React.Fragment key={`${keyBase}-text`}>{text}</React.Fragment>,
        ];
      }

      let nodes: Array<string | React.ReactNode> = [text];

      normalizedHighlightTerms.forEach(({ pattern, key }) => {
        const nextNodes: Array<string | React.ReactNode> = [];

        nodes.forEach((node) => {
          if (typeof node !== 'string') {
            nextNodes.push(
              React.isValidElement(node)
                ? React.cloneElement(node, {
                    key: node.key ?? `${keyBase}-node-${nextNodes.length}`,
                  })
                : node
            );
            return;
          }

          let lastIndex = 0;
          let match: RegExpExecArray | null;

          pattern.lastIndex = 0;
          while ((match = pattern.exec(node)) !== null) {
            const start = match.index;
            const rawMatch = match[0];
            if (start > lastIndex) {
              const fragment = node.slice(lastIndex, start);
              if (fragment) {
                nextNodes.push(
                  <React.Fragment
                    key={`${keyBase}-pre-${start}-${key}`}
                  >
                    {fragment}
                  </React.Fragment>
                );
              }
            }

            let end = start + rawMatch.length;

            const precedingChar = start > 0 ? node[start - 1] : '';
            if (precedingChar && /[0-9A-Za-z]/.test(precedingChar)) {
              const fragment = node.slice(start, end);
              if (fragment) {
                nextNodes.push(
                  <React.Fragment
                    key={`${keyBase}-partial-${start}-${key}`}
                  >
                    {fragment}
                  </React.Fragment>
                );
              }
              lastIndex = end;
              continue;
            }

            const suffix = node.slice(end, end + 2);
            if (suffix === "'s" || suffix === '’s') {
              end += 2;
            }

            const matchedText = node.slice(start, end);
            const trimmed = matchedText.trimEnd();
            const trailing = matchedText.slice(trimmed.length);
            nextNodes.push(
              <span
                key={`${keyBase}-highlight-${key}-${start}`}
                className={highlightClass}
              >
                {trimmed}
              </span>
            );
            if (trailing) {
              nextNodes.push(
                <React.Fragment
                  key={`${keyBase}-highlight-trailing-${key}-${start}`}
                >
                  {trailing}
                </React.Fragment>
              );
            }
            lastIndex = end;
          }

          if (lastIndex < node.length) {
            const fragment = node.slice(lastIndex);
            if (fragment) {
              nextNodes.push(
                <React.Fragment
                  key={`${keyBase}-post-${lastIndex}-${key}`}
                >
                  {fragment}
                </React.Fragment>
              );
            }
          }
        });

        nodes = nextNodes;
      });

      return nodes.map((node, index) => {
        if (typeof node === 'string') {
          return (
            <React.Fragment key={`${keyBase}-text-${index}`}>
              {node}
            </React.Fragment>
          );
        }

        if (React.isValidElement(node)) {
          return React.cloneElement(node, {
            key: node.key ?? `${keyBase}-node-${index}`,
          });
        }

        return node;
      });
    },
    [highlightClass, normalizedHighlightTerms]
  );

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="narrative-content-container"
      className={`narrative-content ${className || ''}`}
    >
      {paragraphs.map((paragraph, index) => {
        const parts = paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
        const paragraphNodes: React.ReactNode[] = [];

        parts.forEach((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            paragraphNodes.push(
              <strong
                key={`paragraph-${index}-strong-${partIndex}`}
                className="text-primary font-bold"
              >
                {renderHighlightedNodes(
                  part.slice(2, -2),
                  `paragraph-${index}-strong-${partIndex}`
                )}
              </strong>
            );
          } else if (part.startsWith('*') && part.endsWith('*')) {
            paragraphNodes.push(
              <em
                key={`paragraph-${index}-em-${partIndex}`}
                className="text-primary"
              >
                {renderHighlightedNodes(
                  part.slice(1, -1),
                  `paragraph-${index}-em-${partIndex}`
                )}
              </em>
            );
          } else {
            paragraphNodes.push(
              ...renderHighlightedNodes(
                part,
                `paragraph-${index}-text-${partIndex}`
              )
            );
          }
        });

        return (
          <p
            key={index}
            className="my-4 leading-relaxed max-w-3xl mx-auto first-of-type:mt-0 last-of-type:mb-0 animate-fade-in"
          >
            {paragraphNodes}
          </p>
        );
      })}

      {enableChunking && hasMore && (
        <div className="flex justify-center">
          <ChunkRevealButton
            onClick={revealNext}
            remainingChunks={totalCount - visibleChunks.length}
            totalChunks={totalCount}
            text={revealButtonText}
          />
        </div>
      )}
    </div>
  );
};

FormattedNarrativeContent.displayName = 'FormattedNarrativeContent';
