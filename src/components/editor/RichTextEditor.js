'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Blockquote from '@tiptap/extension-blockquote';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { BLOCKQUOTE_STYLES } from './blockquoteStyles';

/**
 * Extended Blockquote that preserves inline `style` attributes so that
 * AI-generated styled blockquotes survive TipTap round-trips.
 */
const StyledBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute('style') || null,
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing...', maxLength = 12000 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,   // disable block heading tags
        blockquote: false, // replaced by StyledBlockquote below
      }),
      StyledBlockquote,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] px-4 py-2 text-gray-700',
      },
    },
    immediatelyRender: false,
  });

  // Update editor content when value prop changes from outside
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== value) {
        editor.commands.setContent(value || '');
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const isCharacterLimitReached = editor.storage.characterCount.characters() >= maxLength;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:border-gray-300 transition-all">
      {/* Shared blockquote styles — same across editor, preview modal, and public page */}
      <style dangerouslySetInnerHTML={{ __html: BLOCKQUOTE_STYLES }} />

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50/50 p-2 flex flex-wrap gap-1 items-center">
        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive('bold') ? 'bg-blue-50 text-primary border border-blue-100 font-bold' : 'text-gray-600 border border-transparent'
          }`}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive('italic') ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'
          }`}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <line x1="19" y1="4" x2="10" y2="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
            <line x1="14" y1="20" x2="5" y2="20" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
            <line x1="15" y1="4" x2="9" y2="20" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} />
          </svg>
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive('underline') ? 'bg-blue-50 text-primary border border-blue-100 font-bold' : 'text-gray-600 border border-transparent'
          }`}
          title="Underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3M4 21h16" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Align Left */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-blue-50 text-primary border border-blue-100 font-bold' : 'text-gray-600 border border-transparent'
          }`}
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h10M4 18h14" />
          </svg>
        </button>

        {/* Align Center */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'
          }`}
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M7 12h10M6 18h12" />
          </svg>
        </button>

        {/* Align Right */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'
          }`}
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M10 12h10M8 18h12" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive('bulletList') ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'
          }`}
          title="List"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Formal Quote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive('blockquote') ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'
          }`}
          title="Formal Quote Block"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${
            editor.isActive('link') ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'
          }`}
          title="Link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-200/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Undo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-200/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Redo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m-6-6l-6-6" />
          </svg>
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Character / Word Count Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex justify-between items-center text-[10px] sm:text-xs font-semibold text-gray-500">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Article Body · {editor.storage.characterCount.words()} words
        </span>
        <span className={`font-mono text-[11px] sm:text-xs px-2 py-0.5 rounded-full ${
          isCharacterLimitReached ? 'bg-red-50 text-red-600 font-bold border border-red-100' : 'bg-gray-100 text-gray-600'
        }`}>
          {editor.storage.characterCount.characters()} / {maxLength} chars
        </span>
      </div>
    </div>
  );
}
