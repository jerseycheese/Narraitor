import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadPicker } from '../ImageUploadPicker';
import { MAX_PORTRAIT_UPLOAD_BYTES } from '@/lib/portraits/portraitUpload';

function makeFile(name: string, type: string, sizeInBytes?: number): File {
  const file = new File(['portrait-bytes'], name, { type });
  if (sizeInBytes !== undefined) {
    Object.defineProperty(file, 'size', { value: sizeInBytes });
  }
  return file;
}

describe('ImageUploadPicker', () => {
  it('previews a valid image as an uploaded portrait', async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn();
    render(<ImageUploadPicker onPreview={onPreview} />);

    await user.upload(
      screen.getByLabelText(/choose an image file/i),
      makeFile('hero.png', 'image/png')
    );

    await waitFor(() => {
      expect(onPreview).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'uploaded' })
      );
    });
  });

  it('shows an error and previews nothing for an unsupported type', async () => {
    // applyAccept is off so the file reaches our own validation, the way a
    // dropped file or an "All files" pick would.
    const user = userEvent.setup({ applyAccept: false });
    const onPreview = jest.fn();
    render(<ImageUploadPicker onPreview={onPreview} />);

    await user.upload(
      screen.getByLabelText(/choose an image file/i),
      makeFile('hero.gif', 'image/gif')
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/JPG, PNG or WebP/i);
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('shows an error for a file over the size cap', async () => {
    const user = userEvent.setup();
    const onPreview = jest.fn();
    render(<ImageUploadPicker onPreview={onPreview} />);

    await user.upload(
      screen.getByLabelText(/choose an image file/i),
      makeFile('huge.png', 'image/png', MAX_PORTRAIT_UPLOAD_BYTES + 1)
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/5MB/i);
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('accepts a file dropped onto the drop zone', async () => {
    const onPreview = jest.fn();
    render(<ImageUploadPicker onPreview={onPreview} />);

    const dropZone = screen.getByTestId('portrait-drop-zone');
    const file = makeFile('hero.webp', 'image/webp');

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.drop(dropZone, { dataTransfer: { files: [file], types: ['Files'] } });

    await waitFor(() => {
      expect(onPreview).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'uploaded' })
      );
    });
  });
});
