import { describe, expect, it } from 'vitest';
import { publicAssetUrl } from './assetUrl';

describe('public asset URLs', () => {
  it('resolves bundled PDFs against the Vite base path', () => {
    expect(publicAssetUrl('./sources/exam-2025-complete.pdf', '/inburgeren/')).toBe('/inburgeren/sources/exam-2025-complete.pdf');
  });

  it('keeps absolute URLs unchanged', () => {
    expect(publicAssetUrl('https://example.test/file.pdf')).toBe('https://example.test/file.pdf');
  });
});
