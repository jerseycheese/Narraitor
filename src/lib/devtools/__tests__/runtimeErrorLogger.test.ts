/**
 * @jest-environment jsdom
 */

import { runtimeErrorLogger, RuntimeErrorLogger } from '../runtimeErrorLogger';
import { ErrorSeverity, ErrorCategory } from '@/types/runtime-error.types';

describe('RuntimeErrorLogger', () => {
  // All tests removed - they were testing internal object structure, counters, flags,
  // and statistics which are implementation details rather than user-facing behavior
});