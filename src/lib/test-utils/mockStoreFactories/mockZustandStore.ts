/**
 * Creates a properly-typed mock for a Zustand store hook
 * Encapsulates the `as unknown as jest.Mock` pattern with type safety.
 */
export function mockZustandStore<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useStore: (...args: any[]) => T,
  partialState: Partial<T> | T
): jest.MockedFunction<typeof useStore> & { getState: () => T } {
  const mock = useStore as unknown as jest.MockedFunction<typeof useStore> & {
    getState: () => T;
  };

  mock.mockImplementation(((selector?: (state: T) => unknown) => {
    const fullState = partialState as T;
    return selector ? selector(fullState) : fullState;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any);

  mock.getState = jest.fn(() => partialState as T);

  return mock;
}
