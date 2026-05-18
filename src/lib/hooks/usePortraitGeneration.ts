import { useAIGeneration } from './useAIGeneration';
import type { GeneratedImage } from '@/types/common.types';
import type {
  PortraitRequest,
  PortraitResponse,
} from '@/lib/api/generatePortrait';

export function usePortraitGeneration() {
  return useAIGeneration<PortraitRequest, GeneratedImage | undefined>({
    endpoint: '/api/generate-portrait',
    transform: (data) => (data as PortraitResponse).portrait,
  });
}
