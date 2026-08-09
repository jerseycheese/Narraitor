import {
  MAX_PORTRAIT_UPLOAD_BYTES,
  readPortraitFile,
  validatePortraitFile,
} from '../portraitUpload';

function makeFile(name: string, type: string, sizeInBytes: number): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: sizeInBytes });
  return file;
}

describe('validatePortraitFile', () => {
  it('accepts JPG, PNG and WebP under the size cap', () => {
    expect(validatePortraitFile(makeFile('a.jpg', 'image/jpeg', 1024))).toBeNull();
    expect(validatePortraitFile(makeFile('a.png', 'image/png', 1024))).toBeNull();
    expect(validatePortraitFile(makeFile('a.webp', 'image/webp', 1024))).toBeNull();
  });

  it('rejects an unsupported file type with a message naming the allowed formats', () => {
    const error = validatePortraitFile(makeFile('a.gif', 'image/gif', 1024));
    expect(error).toMatch(/JPG, PNG or WebP/i);
  });

  it('rejects a file over 5MB with a message naming the limit', () => {
    const error = validatePortraitFile(
      makeFile('big.png', 'image/png', MAX_PORTRAIT_UPLOAD_BYTES + 1)
    );
    expect(error).toMatch(/5MB/i);
  });
});

describe('readPortraitFile', () => {
  it('resolves an uploaded portrait carrying the base64 data URL', async () => {
    const file = new File(['hello'], 'a.png', { type: 'image/png' });
    const portrait = await readPortraitFile(file);

    expect(portrait.type).toBe('uploaded');
    expect(portrait.url).toMatch(/^data:/);
    expect(portrait.generatedAt).toBeTruthy();
  });
});
