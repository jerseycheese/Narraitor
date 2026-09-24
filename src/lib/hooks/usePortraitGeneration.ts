import { useCallback } from 'react';
import { useAIGeneration } from './useAIGeneration';
import type { GeneratedImage } from '@/types/common.types';
import type {
  PortraitRequest,
  PortraitResponse,
} from '@/lib/api/generatePortrait';
import { withoutWorldImage } from '@/lib/api/worldPayload';

export function usePortraitGeneration() {
  const { generate: baseGenerate, ...rest } = useAIGeneration<
    PortraitRequest,
    GeneratedImage | undefined
  >({
    endpoint: '/api/generate-portrait',
    transform: (data) => (data as PortraitResponse).portrait,
  });

  const generate = useCallback(
    (requestData: PortraitRequest) =>
      baseGenerate({
        ...requestData,
        world: withoutWorldImage(requestData.world),
      }),
    [baseGenerate]
  );

  return {
    ...rest,
    generate,
  };
}
