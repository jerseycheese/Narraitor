const RATE_LIMIT_DELAY_MS = 1500;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Shared in-flight cache + rate-limited batch runner used by the NPC portrait
 * and item image services. Each service supplies its own entity lookup,
 * payload building, and store updates; the coordinator owns the Promise
 * cache, error cleanup, and batch pacing.
 */
export class ImageRequestCoordinator<TResult> {
  private readonly cache = new Map<string, Promise<TResult>>();

  /**
   * Run (or return the in-flight Promise for) a single request keyed by id.
   * On failure the cache entry is dropped so callers can retry.
   */
  run(id: string, doRequest: () => Promise<TResult>): Promise<TResult> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const promise = doRequest().catch((error) => {
      this.cache.delete(id);
      throw error;
    });
    this.cache.set(id, promise);
    return promise;
  }

  /**
   * Run an async operation per item with rate-limited spacing between calls.
   * Individual failures don't abort the batch — the caller's `runOne` should
   * own its logging.
   */
  async runBatch<T>(
    items: T[],
    runOne: (item: T, index: number) => Promise<void>
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      try {
        await runOne(items[i], i);
      } catch {
        // Swallow — caller logs inside runOne if desired.
      }
      if (i < items.length - 1) {
        await delay(RATE_LIMIT_DELAY_MS);
      }
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}
