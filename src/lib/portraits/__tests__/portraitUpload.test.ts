import {
  MAX_PORTRAIT_EDGE_PX,
  MAX_PORTRAIT_UPLOAD_BYTES,
  downscalePortraitDataUrl,
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

describe('downscalePortraitDataUrl', () => {
  const original = 'data:image/png;base64,abc';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the original when there is no 2D canvas to draw on', async () => {
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(null);

    await expect(downscalePortraitDataUrl(original)).resolves.toBe(original);
  });

  it('redraws an oversized image down to the long-edge cap', async () => {
    const drawImage = jest.fn();
    jest
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/webp;base64,smaller');

    // jsdom never decodes a data URL, so stand in for the loaded bitmap.
    jest
      .spyOn(window.Image.prototype, 'src', 'set')
      .mockImplementation(function (this: HTMLImageElement) {
        Object.defineProperty(this, 'width', { value: 2048 });
        Object.defineProperty(this, 'height', { value: 1024 });
        this.onload?.(new Event('load'));
      });

    await expect(downscalePortraitDataUrl(original)).resolves.toBe(
      'data:image/webp;base64,smaller'
    );
    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      MAX_PORTRAIT_EDGE_PX,
      MAX_PORTRAIT_EDGE_PX / 2
    );
  });
});

describe('readPortraitFile', () => {
  it('resolves an uploaded portrait carrying the base64 data URL', async () => {
    const file = new File(['hello'], 'a.png', { type: 'image/png' });
    const portrait = await readPortraitFile(file);

    expect(portrait.type).toBe('uploaded');
    expect(portrait.url).toMatch(/^data:/);
    // generatedAt/prompt describe an AI generation; an uploaded file has neither.
    expect(portrait.generatedAt).toBeUndefined();
    expect(portrait.prompt).toBeUndefined();
  });
});
