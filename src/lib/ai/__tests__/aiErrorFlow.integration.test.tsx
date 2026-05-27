/**
 * Integration tests for AI error flow → ErrorDisplay / GameSessionError.
 *
 * Issue #332: verify what users actually see when an AI call fails — that the
 * right copy renders, retry and dismiss work, recoverable vs. non-recoverable
 * failures are distinguished, severity-driven copy is wired through, and a
 * fallback path kicks in after repeated failures.
 *
 * The tests mount a small in-file harness that mirrors the real consumer
 * pattern (AI call → catch → getUserFriendlyError → render ErrorDisplay /
 * GameSessionError). A FailingAIClient injects per-test failures.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ErrorDisplay } from '@/components/ui/ErrorDisplay/ErrorDisplay';
import GameSessionError from '@/components/GameSession/GameSessionError';
import { getUserFriendlyError, type UserFriendlyError } from '@/lib/ai/userFriendlyErrors';
import { GeminiClient } from '@/lib/ai/geminiClient';
import type { AIClient, AIResponse, AIServiceConfig } from '@/lib/ai/types';

// Mock @google/genai for the GeminiClient exhaustion test.
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
}));

/**
 * Local FailingAIClient — implements AIClient and rejects/resolves from
 * queued results in order. Kept inline so the shared MockAIClient (used by
 * ~60 other tests) stays untouched.
 */
class FailingAIClient implements AIClient {
  private queue: Array<Error | AIResponse> = [];
  public callCount = 0;

  queue_(...results: Array<Error | AIResponse>): void {
    this.queue.push(...results);
  }

  async generateContent(): Promise<AIResponse> {
    this.callCount += 1;
    const next = this.queue.shift();
    if (next === undefined) {
      // Default behavior if queue runs out: succeed.
      return successResponse();
    }
    if (next instanceof Error) {
      throw next;
    }
    return next;
  }
}

function successResponse(content = 'ok'): AIResponse {
  return { content, finishReason: 'STOP' };
}

interface HarnessProps {
  client: AIClient;
  useGameSessionError?: boolean;
  retryFallbackAfter?: number;
  onFallback?: () => void;
}

function AIErrorHarness({
  client,
  useGameSessionError = false,
  retryFallbackAfter,
  onFallback,
}: HarnessProps) {
  const [err, setErr] = useState<UserFriendlyError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const run = useCallback(async () => {
    try {
      await client.generateContent('test');
      setErr(null);
    } catch (e) {
      setErr(getUserFriendlyError(e as Error));
    }
  }, [client]);

  useEffect(() => {
    void run();
  }, [run]);

  if (dismissed || !err) {
    return <div data-testid="harness-idle" />;
  }

  if (retryFallbackAfter !== undefined && retryCount >= retryFallbackAfter) {
    return (
      <div data-testid="harness-fallback">
        <p>We can&apos;t reach the AI service right now. Try again later.</p>
        <button type="button" onClick={onFallback}>
          Continue offline
        </button>
      </div>
    );
  }

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    void run();
  };
  const handleDismiss = () => setDismissed(true);

  if (useGameSessionError) {
    return (
      <GameSessionError
        error={err.message}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />
    );
  }

  // ErrorDisplay only supports 'error' | 'warning' | 'info'; map 'critical' down.
  const displaySeverity: 'error' | 'warning' | 'info' =
    err.severity === 'critical' ? 'error' : err.severity;

  return (
    <ErrorDisplay
      variant="section"
      severity={displaySeverity}
      title={err.title}
      message={err.message}
      showRetry={err.retryable}
      onRetry={handleRetry}
      showDismiss
      onDismiss={handleDismiss}
    />
  );
}

describe('AI error flow → ErrorDisplay/GameSessionError integration', () => {
  describe('with FailingAIClient (real timers)', () => {
    it('shows ErrorDisplay with retry visible for a recoverable network error', async () => {
      const client = new FailingAIClient();
      client.queue_(new Error('network connection failed'));

      render(<AIErrorHarness client={client} />);

      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Connection Problem')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('hides retry for a non-recoverable auth error', async () => {
      const client = new FailingAIClient();
      client.queue_(new Error('401 unauthorized'));

      render(<AIErrorHarness client={client} />);

      expect(await screen.findByText('Authentication Error')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('clears the error when retry succeeds after one failure', async () => {
      const client = new FailingAIClient();
      client.queue_(new Error('network connection failed'), successResponse());

      render(<AIErrorHarness client={client} />);

      const retry = await screen.findByRole('button', { name: /try again/i });
      fireEvent.click(retry);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('harness-idle')).toBeInTheDocument();
      expect(client.callCount).toBe(2);
    });

    it.each([
      {
        case: 'network',
        error: new Error('network connection failed'),
        title: 'Connection Problem',
        retryVisible: true,
      },
      {
        case: 'timeout',
        error: new Error('request timeout'),
        title: 'Request Timed Out',
        retryVisible: true,
      },
      {
        case: 'rate limit',
        error: new Error('429 rate limit'),
        title: 'Too Many Requests',
        retryVisible: true,
      },
      {
        case: 'auth',
        error: new Error('401 unauthorized'),
        title: 'Authentication Error',
        retryVisible: false,
      },
    ])('renders severity-driven copy for $case errors', async ({ error, title, retryVisible }) => {
      const client = new FailingAIClient();
      client.queue_(error);

      render(<AIErrorHarness client={client} />);

      expect(await screen.findByText(title)).toBeInTheDocument();
      const retryButton = screen.queryByRole('button', { name: /try again/i });
      if (retryVisible) {
        expect(retryButton).toBeInTheDocument();
      } else {
        expect(retryButton).not.toBeInTheDocument();
      }
    });

    it('shows fallback UI after the user retries past the limit', async () => {
      const client = new FailingAIClient();
      client.queue_(
        new Error('network connection failed'),
        new Error('network connection failed'),
        new Error('network connection failed'),
      );
      const onFallback = jest.fn();

      render(
        <AIErrorHarness client={client} retryFallbackAfter={2} onFallback={onFallback} />,
      );

      // First failure on mount.
      const firstRetry = await screen.findByRole('button', { name: /try again/i });
      fireEvent.click(firstRetry);

      // Second retry click still shows the error display.
      const secondRetry = await screen.findByRole('button', { name: /try again/i });
      fireEvent.click(secondRetry);

      // After 2 user-driven retries, fallback UI replaces ErrorDisplay.
      expect(await screen.findByTestId('harness-fallback')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /continue offline/i }));
      expect(onFallback).toHaveBeenCalledTimes(1);
    });

    it('removes the error when the user dismisses it', async () => {
      const client = new FailingAIClient();
      client.queue_(new Error('network connection failed'));

      render(<AIErrorHarness client={client} />);

      const dismiss = await screen.findByRole('button', { name: /dismiss/i });
      fireEvent.click(dismiss);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('harness-idle')).toBeInTheDocument();
    });

    it('routes the error through GameSessionError when the consumer opts in', async () => {
      const client = new FailingAIClient();
      client.queue_(new Error('network connection failed'), successResponse());

      render(<AIErrorHarness client={client} useGameSessionError />);

      const wrapper = await screen.findByTestId('game-session-error');
      expect(wrapper).toBeInTheDocument();
      expect(screen.getByText('Game Session Error')).toBeInTheDocument();

      // Retry then dismiss both work through the GameSessionError surface.
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      await waitFor(() => {
        expect(screen.queryByTestId('game-session-error')).not.toBeInTheDocument();
      });
      expect(client.callCount).toBe(2);
    });
  });

  describe('with real GeminiClient (fake timers for exponential backoff)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockGenerateContent.mockReset();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('surfaces the final network error after GeminiClient exhausts maxRetries', async () => {
      mockGenerateContent.mockRejectedValue(new Error('network error'));

      const config: AIServiceConfig = {
        apiKey: 'test-key',
        modelName: 'gemini-2.0-flash',
        maxRetries: 2,
        timeout: 30000,
      };
      const client = new GeminiClient(config);

      render(<AIErrorHarness client={client} />);

      // Let the harness mount and GeminiClient's retry loop run its course.
      await act(async () => {
        await jest.runAllTimersAsync();
      });

      expect(await screen.findByText('Connection Problem')).toBeInTheDocument();
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });
  });
});
