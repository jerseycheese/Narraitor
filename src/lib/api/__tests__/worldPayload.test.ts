import { withoutWorldImage } from '../worldPayload';

describe('withoutWorldImage', () => {
  it('drops the art and keeps everything else', () => {
    const world = { name: 'Aethermoor', genre: 'fantasy', image: { url: 'data:image/png;base64,AAAA' } };

    expect(withoutWorldImage(world)).toEqual({ name: 'Aethermoor', genre: 'fantasy' });
    expect(world.image).toBeDefined();
  });

  it('passes a missing world through untouched', () => {
    expect(withoutWorldImage(undefined)).toBeUndefined();
    expect(withoutWorldImage(null)).toBeNull();
  });
});
