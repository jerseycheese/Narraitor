import { getSignificanceBadgeVariant, sanitizeFormattedContent } from '../journalUtils';

describe('journalUtils', () => {
  describe('sanitizeFormattedContent', () => {
    it('removes unsafe tags and keeps allowed tags', () => {
      const input = '<p>Hello <em>world</em></p><script>alert("x")</script><div>Block</div><br />';
      const output = sanitizeFormattedContent(input);

      expect(output).toBe('<p>Hello <em>world</em></p>Block<br>');
    });

    it('strips attributes from allowed tags', () => {
      const input = '<p class="foo">Text</p><em style="color:red">Emphasis</em><br id="x">';
      const output = sanitizeFormattedContent(input);

      expect(output).toBe('<p>Text</p><em>Emphasis</em><br>');
    });

    it('removes disallowed tags but preserves text content', () => {
      const input = '<span>Keep me</span><strong>and me</strong>';
      const output = sanitizeFormattedContent(input);

      expect(output).toBe('Keep meand me');
    });
  });

  describe('getSignificanceBadgeVariant', () => {
    it('maps critical to destructive', () => {
      expect(getSignificanceBadgeVariant('critical')).toBe('destructive');
    });

    it('maps major to warning', () => {
      expect(getSignificanceBadgeVariant('major')).toBe('warning');
    });

    it('maps minor and unknown values to secondary', () => {
      expect(getSignificanceBadgeVariant('minor')).toBe('secondary');
      expect(getSignificanceBadgeVariant('unknown')).toBe('secondary');
    });
  });
});
