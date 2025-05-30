import React from 'react';
import { WorldImage as WorldImageType } from '@/types/world.types';

interface WorldImageProps {
  image?: WorldImageType;
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
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48',
    xlarge: 'w-64 h-64'
  };

  const aspectRatio = size === 'small' ? 'aspect-square' : 'aspect-video';

  if (error) {
    return (
      <div className={`${sizeClasses[size]} ${aspectRatio} bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-red-600 p-2">
          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs">Error loading image</p>
        </div>
      </div>
    );
  }

  if (!image || image.type === 'placeholder' || !image.url) {
    return (
      <div className={`${sizeClasses[size]} ${aspectRatio} bg-gray-100 border-2 border-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">No image</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${aspectRatio} rounded-lg overflow-hidden border-2 border-gray-200 ${className}`}>
      <img
        src={image.url}
        alt={`${worldName} world image`}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.innerHTML = `
              <div class="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <div class="text-center">
                  <svg class="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-xs">Image failed to load</p>
                </div>
              </div>
            `;
          }
        }}
      />
    </div>
  );
};

export default WorldImage;