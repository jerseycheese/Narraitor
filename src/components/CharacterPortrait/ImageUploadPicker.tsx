'use client';

import React, { useId, useState } from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { GeneratedImage } from '@/types/common.types';
import {
  PORTRAIT_UPLOAD_ACCEPT,
  readPortraitFile,
  validatePortraitFile,
} from '@/lib/portraits/portraitUpload';
import './ImageUploadPicker.css';

interface ImageUploadPickerProps {
  onPreview: (portrait: GeneratedImage) => void;
  className?: string;
}

export function ImageUploadPicker({
  onPreview,
  className,
}: ImageUploadPickerProps) {
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    const validationError = validatePortraitFile(file);
    if (validationError) {
      setError(validationError);
      setFileName(null);
      return;
    }

    try {
      const portrait = await readPortraitFile(file);
      setError(null);
      setFileName(file.name);
      onPreview(portrait);
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "That image couldn't be read. Try picking it again."
      );
      setFileName(null);
    }
  };

  const handleInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    await handleFile(event.target.files?.[0]);
    // Reset so picking the same file twice still fires a change event.
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    await handleFile(event.dataTransfer?.files?.[0]);
  };

  return (
    <div className={clsx('component-image-upload-picker', className)}>
      <div
        className={clsx(
          'image-upload-picker-drop-zone',
          isDraggingOver && 'image-upload-picker-drop-zone-active'
        )}
        data-testid="portrait-drop-zone"
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
      >
        <Upload aria-hidden="true" />
        <p className="image-upload-picker-instructions">
          Drag an image here, or
        </p>
        <label htmlFor={inputId} className="image-upload-picker-trigger">
          Choose an image file
        </label>
        <input
          id={inputId}
          type="file"
          className="sr-only"
          accept={PORTRAIT_UPLOAD_ACCEPT}
          onChange={handleInputChange}
        />
        <p className="image-upload-picker-hint">JPG, PNG or WebP, up to 5MB.</p>
      </div>

      {fileName && !error && (
        <p className="image-upload-picker-filename">Ready to use: {fileName}</p>
      )}

      {error && (
        <p className="image-upload-picker-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
