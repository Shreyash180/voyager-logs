import { describe, expect, it } from "vitest";
import { normalizeLegacyPostContent } from "../../src/lib/markdown";

describe("normalizeLegacyPostContent", () => {
  it("returns markdown unchanged when content is already markdown", () => {
    const input = "# Hello\n\nThis is **bold** text.";
    expect(normalizeLegacyPostContent(input)).toBe(input);
  });

  it("converts basic HTML tags to markdown", () => {
    const input = "<h1>Hello</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p><ul><li>One</li><li>Two</li></ul>";
    const expected = "# Hello\n\nThis is **bold** and *italic*.\n\n- One\n- Two";
    expect(normalizeLegacyPostContent(input)).toBe(expected);
  });

  it("converts links and line breaks", () => {
    const input = "<p>Visit <a href=\"https://example.com\">Example</a></p><br><p>Done.</p>";
    const expected = "Visit [Example](https://example.com)\n\nDone.";
    expect(normalizeLegacyPostContent(input)).toBe(expected);
  });
});
