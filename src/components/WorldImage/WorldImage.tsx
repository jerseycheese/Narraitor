import React, { useState } from 'react';
import Image from 'next/image';
import { GeneratedImage } from '@/types/common.types';
import { ImageOff, AlertCircle } from 'lucide-react';

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

  const aspectRatio = size === 'small' ? 'aspect-square' : 'aspect-video';

  if (error || loadFailed) {
    return (
      <div className={`${aspectRatio} ${className}`}>
        <div>
          <AlertCircle aria-hidden="true" />
          <p>Error loading image</p>
        </div>
      </div>
    );
  }

  if (!image || image.type === 'placeholder' || !image.url) {
    return (
      <div className={`${aspectRatio} ${className}`}>
        <div>
          <ImageOff aria-hidden="true" />
          <p>No image</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${aspectRatio} ${className}`}>
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

