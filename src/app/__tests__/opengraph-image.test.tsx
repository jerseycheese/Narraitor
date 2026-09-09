/**
 * @jest-environment node
 */
import os from 'os';

describe('opengraph-image', () => {
  const realCwd = process.cwd;

  afterEach(() => {
    process.cwd = realCwd;
    jest.resetModules();
  });

  // Vercel runs on-demand routes from /var/task, which has no public/ directory.
  // A module-scope file read there throws ENOENT while metadata resolves, which
  // took down every [id] route in production (#2062). Static routes survived
  // because they were prerendered on the build worker, where public/ exists.
  it('evaluates when the working directory has no public directory', () => {
    process.cwd = () => os.tmpdir();
    jest.resetModules();

    expect(() => require('../opengraph-image')).not.toThrow();
  });

  it('still renders the image response', () => {
    const { default: OpengraphImage } = require('../opengraph-image');

    expect(OpengraphImage().headers.get('content-type')).toBe('image/png');
  });
});
