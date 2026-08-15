'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';
import { GeneratedImage } from '@/types/common.types';
import { ImageOff, AlertCircle } from 'lucide-react';
import { useImageGenerationSupport } from '@/hooks/useImageGenerationSupport';

interface WorldImageProps {
  image?: GeneratedImage;
  worldName: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  error?: string | null;
}

export const WorldImage: React.FC<WorldImageProps> = ({
  image,
  worldName,
  size = 'medium',
  className = '',
  error,
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const imageSupport = useImageGenerationSupport();

  const aspectRatio = size === 'small' ? 'aspect-square' : 'aspect-video';

  if (error || loadFailed) {
    return (
      <div className={clsx('component-world-image', aspectRatio, className)}>
        <div>
          <AlertCircle aria-hidden="true" />
          <p>Error loading image</p>
        </div>
      </div>
    );
  }

  if (!image || image.type === 'placeholder' || !image.url) {
    return (
      <div className={clsx('component-world-image', aspectRatio, className)}>
        <div>
          <ImageOff aria-hidden="true" />
          {/* The provider is the likeliest reason there is nothing here, and
              saying so is the difference between a limit and a broken app. */}
          <p>{imageSupport.reason ?? 'No image'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('component-world-image', aspectRatio, className)}>
      <Image
        src={image.url}
        alt={`${worldName} world image`}
        width={400}
        height={300}
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
};

