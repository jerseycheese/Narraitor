'use client';

import React from 'react';
import { DataField } from '@/components/shared/DataField';
import { GeneratedImage } from '@/types/common.types';
import { formatDate } from '@/lib/utils';

interface WorldImageDisplayProps {
  image?: GeneratedImage;
}

export function WorldImageDisplay({ image }: WorldImageDisplayProps) {
  // Only show if there's an image with metadata
  if (!image || !image.url) {
    return null;
  }

  const hasMetadata =
    image.generatedAt || image.prompt || image.type === 'ai-generated';

  // Don't show a section if there's no meaningful metadata to display
  if (!hasMetadata) {
    return null;
  }

  return (
    <section
      className="world-detail-section"
      aria-labelledby="image-details-heading"
    >
      <h2 id="image-details-heading">World image details</h2>

      <div className="world-detail-meta-grid">
        <DataField
          label="Image Type"
          value={image.type === 'ai-generated' ? 'Generated' : 'Custom'}
          variant="outline"
        />

        {image.generatedAt && (
          <DataField
            label="Generated"
            value={formatDate(image.generatedAt)}
            variant="outline"
          />
        )}

        {image.prompt && (
          <DataField
            label="Generation Prompt"
            value={image.prompt}
            variant="stacked"
          />
        )}
      </div>
    </section>
  );
}
