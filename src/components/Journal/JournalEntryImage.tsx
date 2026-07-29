'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ImageOff, AlertCircle } from 'lucide-react';
import { JournalEntry } from '@/types/journal.types';
import { GeneratedImage } from '@/types/common.types';
import { ImageGenerationSection } from '@/components/shared';
import { generateJournalImage } from '@/lib/api/journalImageApi';
import { useJournalStore } from '@/state/journalStore';
import { useWorldStore } from '@/state/worldStore';
import { getTimestamp } from '@/lib/utils';

interface JournalEntryImageProps {
  entry: JournalEntry;
}

const EntryImagePreview: React.FC<{
  image?: GeneratedImage;
  title: string;
  error?: string | null;
}> = ({ image, title, error }) => {
  const [loadFailed, setLoadFailed] = useState(false);

  // Clear a stale load failure when a new image is generated, otherwise the
  // component stays stuck on "Error loading image" until a full remount.
  useEffect(() => {
    setLoadFailed(false);
  }, [image?.url]);

  if (error || loadFailed) {
    return (
      <div className="journal-entry-image-preview" data-state="error">
        <AlertCircle aria-hidden="true" />
        <p>Error loading image</p>
      </div>
    );
  }

  if (!image || image.type === 'placeholder' || !image.url) {
    return (
      <div className="journal-entry-image-preview" data-state="empty">
        <ImageOff aria-hidden="true" />
        <p>No image</p>
      </div>
    );
  }

  return (
    <div className="journal-entry-image-preview" data-state="ready">
      <Image
        src={image.url}
        alt={`Illustration for ${title}`}
        width={640}
        height={360}
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
};

export const JournalEntryImage: React.FC<JournalEntryImageProps> = ({ entry }) => {
  const world = useWorldStore((state) => state.worlds[entry.worldId]);
  const updateEntry = useJournalStore((state) => state.updateEntry);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const image = entry.metadata.image;
  const entryTitle = entry.title || 'this entry';

  const persistImage = (next: GeneratedImage) => {
    updateEntry(entry.id, {
      metadata: { ...entry.metadata, image: next },
    });
  };

  const handleGenerate = async (customPrompt?: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const generated = await generateJournalImage(entry, world, customPrompt);
      persistImage(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRemove = () => {
    persistImage({ type: 'placeholder', url: null, generatedAt: getTimestamp() });
  };

  return (
    <ImageGenerationSection
      className="journal-entry-image"
      headingLevel="h4"
      title="Entry Image"
      description="An illustration generated for this moment in your story."
      currentImageUrl={image?.url}
      currentImageType={image?.type}
      generatedAt={image?.generatedAt}
      currentPrompt={image?.prompt}
      isGenerating={isGenerating}
      onGenerate={handleGenerate}
      onRemove={handleRemove}
      error={error}
      customPromptLabel="Customize description for this image"
      customPromptPlaceholder="Describe the specific visual details you want in the image..."
      customPromptHelpText="This will override the auto-generated prompt based on the entry content for this generation only"
      generateButtonText="Generate Image"
      regenerateButtonText="Regenerate Image"
      removeButtonText="Remove Image"
      imageComponent={
        <EntryImagePreview image={image} title={entryTitle} error={error} />
      }
    />
  );
};
