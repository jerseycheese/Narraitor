declare global {
  interface Window {
    worldListTestUtils: {
      addTestWorlds: () => Promise<void>;
      clearWorlds: () => Promise<void>;
      setLoadingState: (loading: boolean) => Promise<void>;
      setErrorState: (error: string | null) => Promise<void>;
      inspectStore: () => void;
    };
  }
}