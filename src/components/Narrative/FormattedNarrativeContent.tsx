import React from 'react';
import { escapeRegExp, safeTrim } from '@/lib/utils';

interface FormattedNarrativeContentProps {
  content: string;
  className?: string;
  highlightTerms?: string[];
  highlightClassName?: string;
  definitionTerms?: string[];
  onTermClick?: (termText: string, anchorElement: HTMLElement) => void;
}

const isWordCharacter = (value: string) => /[0-9A-Za-z]/.test(value);

export const FormattedNarrativeContent: React.FC<
  FormattedNarrativeContentProps
> = ({ content, className, highlightTerms, highlightClassName, definitionTerms, onTermClick }) => {
  const normalizedContent = typeof content === 'string' ? content : '';
  const trimmedContent = safeTrim(normalizedContent);

  const paragraphs = React.useMemo(() => {
    if (!trimmedContent) {
      return [];
    }
    return trimmedContent
      .split(/(?:\n\s*){2,}/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }, [trimmedContent]);

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

  const normalizedDefinitionTerms = React.useMemo(() => {
    if (!definitionTerms || definitionTerms.length === 0) {
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

    definitionTerms.forEach(addTerm);

    return Array.from(uniqueTerms.values()).sort(
      (a, b) => b.length - a.length
    );
  }, [definitionTerms]);

  const highlightClass =
    highlightClassName ||
    'narrative-highlight';

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
            if (precedingChar && isWordCharacter(precedingChar)) {
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
            } else {
              const followingChar = node[end] ?? '';
              if (followingChar && isWordCharacter(followingChar)) {
                const fragment = node.slice(start, end);
                if (fragment) {
                  nextNodes.push(
                    <React.Fragment
                      key={`${keyBase}-partial-end-${start}-${key}`}
                    >
                      {fragment}
                    </React.Fragment>
                  );
                }
                lastIndex = end;
                continue;
              }
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

  const renderDefinitionNodes = React.useCallback(
    (nodes: React.ReactNode[], keyBase: string): React.ReactNode[] => {
      if (normalizedDefinitionTerms.length === 0) {
        return nodes;
      }

      let current: React.ReactNode[] = nodes;

      normalizedDefinitionTerms.forEach(({ pattern, key }) => {
        const nextNodes: React.ReactNode[] = [];

        current.forEach((node, nodeIndex) => {
          if (React.isValidElement(node)) {
            const el = node as React.ReactElement;

            // Skip already-wrapped span highlights and button elements
            if (el.type === 'span' || el.type === 'button') {
              nextNodes.push(node);
              return;
            }

            // Fragment wrapping a plain text string: process it
            if (el.type === React.Fragment) {
              const children = (el.props as { children?: React.ReactNode }).children;
              if (typeof children === 'string') {
                const text = children;
                const fragmentKey =
                  el.key ?? `${keyBase}-frag-${nodeIndex}`;
                const innerNodes: React.ReactNode[] = [];
                let lastIndex = 0;
                let match: RegExpExecArray | null;

                pattern.lastIndex = 0;
                while ((match = pattern.exec(text)) !== null) {
                  const start = match.index;
                  const rawMatch = match[0];

                  if (start > lastIndex) {
                    const fragment = text.slice(lastIndex, start);
                    if (fragment) {
                      innerNodes.push(
                        <React.Fragment
                          key={`${fragmentKey}-pre-${start}-${key}`}
                        >
                          {fragment}
                        </React.Fragment>
                      );
                    }
                  }

                  let end = start + rawMatch.length;

                  const precedingChar =
                    start > 0 ? text[start - 1] : '';
                  if (
                    precedingChar &&
                    isWordCharacter(precedingChar)
                  ) {
                    const fragment = text.slice(start, end);
                    if (fragment) {
                      innerNodes.push(
                        <React.Fragment
                          key={`${fragmentKey}-partial-${start}-${key}`}
                        >
                          {fragment}
                        </React.Fragment>
                      );
                    }
                    lastIndex = end;
                    continue;
                  }

                  const lookupText = rawMatch;
                  const suffix = text.slice(end, end + 2);
                  if (suffix === "'s" || suffix === '\u2019s') {
                    end += 2;
                  } else {
                    const followingChar = text[end] ?? '';
                    if (followingChar && isWordCharacter(followingChar)) {
                      const fragment = text.slice(start, end);
                      if (fragment) {
                        innerNodes.push(
                          <React.Fragment
                            key={`${fragmentKey}-partial-end-${start}-${key}`}
                          >
                            {fragment}
                          </React.Fragment>
                        );
                      }
                      lastIndex = end;
                      continue;
                    }
                  }

                  const matchedText = text.slice(start, end);
                  const trimmed = matchedText.trimEnd();
                  const trailing = matchedText.slice(trimmed.length);

                  innerNodes.push(
                    <button
                      type="button"
                      className="manuscript-marginalia-term"
                      aria-haspopup="dialog"
                      onClick={(e) =>
                        onTermClick?.(lookupText, e.currentTarget)
                      }
                      key={`${fragmentKey}-defterm-${key}-${start}`}
                    >
                      {trimmed}
                    </button>
                  );
                  if (trailing) {
                    innerNodes.push(
                      <React.Fragment
                        key={`${fragmentKey}-defterm-trailing-${key}-${start}`}
                      >
                        {trailing}
                      </React.Fragment>
                    );
                  }
                  lastIndex = end;
                }

                if (lastIndex === 0) {
                  // No matches in this fragment; pass through unchanged
                  nextNodes.push(node);
                  return;
                }

                if (lastIndex < text.length) {
                  const fragment = text.slice(lastIndex);
                  if (fragment) {
                    innerNodes.push(
                      <React.Fragment
                        key={`${fragmentKey}-post-${lastIndex}-${key}`}
                      >
                        {fragment}
                      </React.Fragment>
                    );
                  }
                }

                nextNodes.push(...innerNodes);
                return;
              }
            }

            // Any other element type: pass through unchanged
            nextNodes.push(node);
            return;
          }

          // Raw string or other non-element: pass through
          nextNodes.push(node);
        });

        current = nextNodes;
      });

      return current;
    },
    [normalizedDefinitionTerms, onTermClick]
  );

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="narrative-content-container"
      className={`text-narrative ${className || ''}`}
    >
      {paragraphs.map((paragraph, index) => {
        const parts = paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
        const paragraphNodes: React.ReactNode[] = [];

        parts.forEach((part, partIndex) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            paragraphNodes.push(
              <strong
                key={`paragraph-${index}-strong-${partIndex}`}
                
              >
                {renderDefinitionNodes(
                  renderHighlightedNodes(
                    part.slice(2, -2),
                    `paragraph-${index}-strong-${partIndex}`
                  ),
                  `paragraph-${index}-strong-${partIndex}`
                )}
              </strong>
            );
          } else if (part.startsWith('*') && part.endsWith('*')) {
            paragraphNodes.push(
              <em
                key={`paragraph-${index}-em-${partIndex}`}
                
              >
                {renderDefinitionNodes(
                  renderHighlightedNodes(
                    part.slice(1, -1),
                    `paragraph-${index}-em-${partIndex}`
                  ),
                  `paragraph-${index}-em-${partIndex}`
                )}
              </em>
            );
          } else {
            paragraphNodes.push(
              ...renderDefinitionNodes(
                renderHighlightedNodes(
                  part,
                  `paragraph-${index}-text-${partIndex}`
                ),
                `paragraph-${index}-text-${partIndex}`
              )
            );
          }
        });

        return (
          <p key={index}>
            {paragraphNodes}
          </p>
        );
      })}
    </div>
  );
};

FormattedNarrativeContent.displayName = 'FormattedNarrativeContent';
