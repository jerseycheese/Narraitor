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
  error
}) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
    xlarge: 'w-64 h-64'
  };

  const aspectRatio = size === 'small' ? 'aspect-square' : 'aspect-video';

  if (error || loadFailed) {
    return (
      <div className={`${sizeClasses[size]} ${aspectRatio} bg-red-200 border-2 border-red-500 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-red-500 p-2">
          <AlertCircle className="w-8 h-8 mx-auto mb-1" aria-hidden="true" />
          <p className="text-xs">Error loading image</p>
        </div>
      </div>
    );
  }

  if (!image || image.type === 'placeholder' || !image.url) {
    return (
      <div className={`${sizeClasses[size]} ${aspectRatio} bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <ImageOff className="w-8 h-8 mx-auto mb-1" aria-hidden="true" />
          <p className="text-xs">No image</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${aspectRatio} rounded-lg overflow-hidden border-2 border-gray-200 ${className}`}>
      <Image
        src={image.url}
        alt={`${worldName} world image`}
        width={400}
        height={300}
        className="w-full h-full object-cover"
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
};

export default WorldImage;
