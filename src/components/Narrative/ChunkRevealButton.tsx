/**
 * Button component for revealing more narrative content chunks.
 * Shows remaining content indicator and handles progressive disclosure.
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/classNames';

export interface ChunkRevealButtonProps {
  /** Handler for click event */
  onClick: () => void;
  /** Number of remaining chunks to reveal */
  remainingChunks?: number;
  /** Total number of chunks (for progress indication) */
  totalChunks?: number;
  /** Custom button text (default: "Continue Reading") */
  text?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Button variant */
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link';
}

/**
 * Button for revealing more narrative content in a progressive disclosure pattern.
 *
 * @example
 * ```tsx
 * <ChunkRevealButton
 *   onClick={revealNext}
 *   remainingChunks={5}
 *   totalChunks={10}
 * />
 * ```
 */
export function ChunkRevealButton({
  onClick,
  remainingChunks,
  totalChunks,
  text = 'Continue Reading',
  disabled = false,
  className,
  variant = 'outline',
}: ChunkRevealButtonProps) {
  const showProgress = remainingChunks !== undefined && totalChunks !== undefined && totalChunks > 0;

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      className={cn(
        'chunk-reveal-button',
        'mt-6 transition-all duration-300',
        'hover:scale-105 active:scale-95',
        className
      )}
      aria-label={
        showProgress
          ? `${text}. ${remainingChunks} of ${totalChunks} sections remaining`
          : text
      }
    >
      <span className="flex items-center gap-2">
        <span>{text}</span>
        {showProgress && remainingChunks > 0 && (
          <span className="text-xs opacity-70">
            ({remainingChunks} more)
          </span>
        )}
      </span>
    </Button>
  );
}
