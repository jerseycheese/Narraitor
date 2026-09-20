'use client';

import { GeneratedImage } from '@/types/common.types';

interface WorldImageDisplayProps {
  image?: GeneratedImage;
}

export function WorldImageDisplay({ image: _image }: WorldImageDisplayProps) {
  // Internal developer metadata (image type, generation prompt, generated timestamp)
  // has been stripped per #2090.
  return null;
}
