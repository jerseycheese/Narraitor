/**
 * MVP-level tests for the stream resilience middleware (issue #903).
 *
 * Covers both the resolve path (clean completion, resume-then-continue,
 * premature-close recovery) and the reject path (non-transient error,
 * exhausted resume budget).
 */

import {
  resilientStream,
  ResumeInfo,
  ResumeContext,
  StreamInterruptedError,
  DEFAULT_MAX_RESUMES,
} from '../streamResilience';

// Use the project's logger mock so resume warn/error logs don't clutter output.
jest.mock('@/lib/utils/logger');

/** Yields each chunk in order, then completes cleanly. */
async function* yieldChunks(chunks: string[]): AsyncGenerator<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

/** Yields the given chunks, then throws — simulates an interrupted stream. */
async function* yieldThenThrow(
  chunks: string[],
  error: Error
): AsyncGenerator<string> {
  for (const chunk of chunks) {
    yield chunk;
  }
  throw error;
}

/** Drains an async generator into the full concatenated string. */
async function collect(stream: AsyncGenerator<string>): Promise<string> {
  let output = '';
  for await (const chunk of stream) {
    output += chunk;
  }
  return output;
}

// Instant delay so resume timing never slows the suite.
const noDelay = (): Promise<void> => Promise.resolve();

describe('resilientStream', () => {
  describe('resolve path', () => {
    test('streams every chunk and never resumes on clean completion', async () => {
      const onResume = jest.fn();

      const output = await collect(
        resilientStream(() => yieldChunks(['a', 'b', 'c']), {
          onResume,
          delay: noDelay,
        })
      );

      expect(output).toBe('abc');
      expect(onResume).not.toHaveBeenCalled();
    });

    test('continues from captured output after a transient failure', async () => {
      const onResume = jest.fn();
      const contexts: ResumeContext[] = [];

      // A continuation-aware factory: the first attempt drops mid-stream, the
      // resume uses ctx.partialOutput to continue rather than regenerate.
      const generateFn = (ctx: ResumeContext): AsyncGenerator<string> => {
        contexts.push({ ...ctx });
        return ctx.attempt === 0
          ? yieldThenThrow(['Hel'], new Error('network timeout'))
          : yieldChunks(['lo', ' world']);
      };

      const output = await collect(
        resilientStream(generateFn, { onResume, delay: noDelay })
      );

      expect(output).toBe('Hello world');
      // Factory was handed the captured prefix so it could continue.
      expect(contexts[0]).toEqual({ attempt: 0, partialOutput: '' });
      expect(contexts[1]).toEqual({ attempt: 1, partialOutput: 'Hel' });

      expect(onResume).toHaveBeenCalledTimes(1);
      const info = onResume.mock.calls[0][0] as ResumeInfo;
      expect(info.attempt).toBe(1);
      expect(info.partialOutput).toBe('Hel');
      expect(info.newOutput).toBe('Hel');
      expect(info.error).toBeInstanceOf(Error);
    });

    test('resumes when isComplete reports a premature stream close', async () => {
      const onResume = jest.fn();

      // Streams end cleanly but the first is missing the END sentinel.
      const generateFn = (ctx: ResumeContext): AsyncGenerator<string> =>
        ctx.attempt === 0 ? yieldChunks(['partial']) : yieldChunks([' END']);

      const output = await collect(
        resilientStream(generateFn, {
          isComplete: (full) => full.endsWith('END'),
          onResume,
          delay: noDelay,
        })
      );

      expect(output).toBe('partial END');
      expect(onResume).toHaveBeenCalledTimes(1);
      const info = onResume.mock.calls[0][0] as ResumeInfo;
      expect(info.error).toBeInstanceOf(StreamInterruptedError);
      expect(info.newOutput).toBe('partial');
    });
  });

  describe('reject path', () => {
    test('rethrows a non-transient error without resuming', async () => {
      const onResume = jest.fn();

      await expect(
        collect(
          resilientStream(
            () => yieldThenThrow([], new Error('validation failed')),
            { onResume, delay: noDelay }
          )
        )
      ).rejects.toThrow('validation failed');

      expect(onResume).not.toHaveBeenCalled();
    });

    test('rethrows after exhausting the resume budget', async () => {
      const onResume = jest.fn();
      let calls = 0;

      const generateFn = (): AsyncGenerator<string> => {
        calls += 1;
        return yieldThenThrow([], new Error('network connection lost'));
      };

      await expect(
        collect(resilientStream(generateFn, { onResume, delay: noDelay }))
      ).rejects.toThrow('network connection lost');

      // Initial attempt + DEFAULT_MAX_RESUMES resumes.
      expect(calls).toBe(DEFAULT_MAX_RESUMES + 1);
      expect(onResume).toHaveBeenCalledTimes(DEFAULT_MAX_RESUMES);
    });

    test('rethrows StreamInterruptedError when premature closes exhaust the budget', async () => {
      const onResume = jest.fn();

      // Every attempt ends short of the sentinel.
      const generateFn = (): AsyncGenerator<string> => yieldChunks(['x']);

      await expect(
        collect(
          resilientStream(generateFn, {
            isComplete: (full) => full.endsWith('END'),
            onResume,
            delay: noDelay,
          })
        )
      ).rejects.toBeInstanceOf(StreamInterruptedError);

      expect(onResume).toHaveBeenCalledTimes(DEFAULT_MAX_RESUMES);
    });

    test('honors a custom isTransient predicate', async () => {
      const onResume = jest.fn();

      const generateFn = (ctx: ResumeContext): AsyncGenerator<string> =>
        ctx.attempt === 0
          ? yieldThenThrow(['x'], new Error('CUSTOM_RETRY'))
          : yieldChunks(['y']);

      const output = await collect(
        resilientStream(generateFn, {
          isTransient: (error) =>
            error instanceof Error && error.message === 'CUSTOM_RETRY',
          onResume,
          delay: noDelay,
        })
      );

      expect(output).toBe('xy');
      expect(onResume).toHaveBeenCalledTimes(1);
    });
  });
});
