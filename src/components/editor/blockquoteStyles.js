/**
 * Shared blockquote CSS injected into all article rendering surfaces
 * (RichTextEditor, FullArticlePreview, press-releases/[id]/page)
 * so styled blockquotes from AI output look identical everywhere.
 */
export const BLOCKQUOTE_STYLES = `
  /* ── Blockquote container ── */
  .article-html blockquote,
  .ProseMirror blockquote,
  .prose blockquote,
  .html-content-preview blockquote,
  .html-content-body blockquote {
    border-left: 4px solid #2563eb !important;
    padding: 1.25rem 1.5rem !important;
    margin: 1.75rem 0 !important;
    background-color: #f0f7ff !important;
    border-radius: 0 10px 10px 0 !important;
    color: #1e3a8a !important;
    font-style: italic !important;
    box-shadow: 0 1px 4px 0 rgba(37,99,235,0.07) !important;
  }

  /* ── First <p> = quote text ── */
  .article-html blockquote > p:first-child,
  .ProseMirror blockquote > p:first-child,
  .prose blockquote > p:first-child,
  .html-content-preview blockquote > p:first-child,
  .html-content-body blockquote > p:first-child {
    margin: 0 0 0.5rem 0 !important;
    font-size: 1.05rem !important;
    font-weight: 500 !important;
    line-height: 1.7 !important;
    color: #1e3a8a !important;
    font-style: italic !important;
  }

  /* ── Second <p> or <cite> or <footer> = author attribution ── */
  .article-html blockquote > p:not(:first-child),
  .article-html blockquote > cite,
  .article-html blockquote > footer,
  .ProseMirror blockquote > p:not(:first-child),
  .ProseMirror blockquote > cite,
  .ProseMirror blockquote > footer,
  .prose blockquote > p:not(:first-child),
  .prose blockquote > cite,
  .prose blockquote > footer,
  .html-content-preview blockquote > p:not(:first-child),
  .html-content-preview blockquote > cite,
  .html-content-preview blockquote > footer,
  .html-content-body blockquote > p:not(:first-child),
  .html-content-body blockquote > cite,
  .html-content-body blockquote > footer {
    display: block !important;
    margin: 0 !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    color: #4b5563 !important;
    font-style: normal !important;
    letter-spacing: 0.01em !important;
  }
`;
