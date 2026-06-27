'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Blockquote from '@tiptap/extension-blockquote';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect, useState } from 'react';
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

const CustomTableCell = TableCell.extend({
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

const CustomTableHeader = TableHeader.extend({
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
  const [isHtmlMode, setIsHtmlMode] = useState(false);

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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'min-w-full border-collapse border border-gray-300 my-4',
        },
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
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
    if (editor && value !== undefined && !isHtmlMode) {
      const currentContent = editor.getHTML();
      if (currentContent !== value) {
        editor.commands.setContent(value || '');
      }
    }
  }, [value, editor, isHtmlMode]);

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

  const isCharacterLimitReached = isHtmlMode ? (value || '').length >= maxLength : editor.storage.characterCount.characters() >= maxLength;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:border-gray-300 transition-all flex flex-col">
      {/* Shared blockquote styles — same across editor, preview modal, and public page */}
      <style dangerouslySetInnerHTML={{ __html: BLOCKQUOTE_STYLES }} />
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          min-width: 1em;
          border: 1px solid #d1d5db;
          padding: 8px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .ProseMirror table th {
          font-weight: bold;
          text-align: left;
          background-color: #f3f4f6;
        }
        .ProseMirror .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
        .ProseMirror .column-resize-handle {
          position: absolute;
          right: -2px; top: 0; bottom: -2px;
          width: 4px;
          background-color: #adf;
          pointer-events: none;
        }
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1rem;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1rem;
        }
        .ProseMirror li {
          margin-bottom: 0.25rem;
        }
        .ProseMirror li > p {
          margin: 0;
          display: inline;
        }
      ` }} />

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50/50 p-2 flex flex-wrap gap-1 items-center justify-between">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run() || isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive('bold') && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100 font-bold' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
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
            disabled={!editor.can().chain().focus().toggleItalic().run() || isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive('italic') && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
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
            disabled={!editor.can().chain().focus().toggleUnderline().run() || isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive('underline') && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100 font-bold' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3M4 21h16" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Alignments */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive({ textAlign: 'left' }) && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100 font-bold' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Align Left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive({ textAlign: 'center' }) && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Align Center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M7 12h10M6 18h12" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive({ textAlign: 'right' }) && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Align Right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M10 12h10M8 18h12" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive('bulletList') && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Bullet List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Ordered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive('orderedList') && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Ordered List"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 6h14M7 12h14M7 18h14M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Table Controls */}
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            disabled={isHtmlMode || editor.isActive('table')}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all text-gray-600 border border-transparent disabled:opacity-40 disabled:cursor-not-allowed ${editor.isActive('table') ? 'hidden' : ''}`}
            title="Insert Table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {editor.isActive('table') && !isHtmlMode && (
            <div className="flex items-center gap-1 bg-blue-50/50 p-1 rounded-lg border border-blue-100">
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="p-1.5 rounded text-blue-600 hover:bg-blue-100 transition-all"
                title="Add Row Below"
              >
                <span className="text-[10px] font-bold px-1 whitespace-nowrap">+ Row</span>
              </button>
              
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="p-1.5 rounded text-blue-600 hover:bg-blue-100 transition-all"
                title="Add Column Right"
              >
                <span className="text-[10px] font-bold px-1 whitespace-nowrap">+ Col</span>
              </button>

              <div className="w-px h-4 bg-blue-200 mx-1" />

              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="p-1.5 rounded text-red-500 hover:bg-red-100 transition-all"
                title="Delete Row"
              >
                <span className="text-[10px] font-bold px-1 whitespace-nowrap">- Row</span>
              </button>
              
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="p-1.5 rounded text-red-500 hover:bg-red-100 transition-all"
                title="Delete Column"
              >
                <span className="text-[10px] font-bold px-1 whitespace-nowrap">- Col</span>
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="p-1.5 rounded text-red-600 hover:bg-red-100 transition-all ml-1"
                title="Delete Entire Table"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Formal Quote */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive('blockquote') && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
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
            disabled={isHtmlMode}
            className={`p-2 rounded-lg hover:bg-gray-200/70 transition-all ${editor.isActive('link') && !isHtmlMode ? 'bg-blue-50 text-primary border border-blue-100' : 'text-gray-600 border border-transparent'} disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Link"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Undo/Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run() || isHtmlMode}
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
            disabled={!editor.can().chain().focus().redo().run() || isHtmlMode}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200/70 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m-6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Edit as HTML Toggle */}
        <div>
          <button
            type="button"
            onClick={() => {
              if (isHtmlMode) {
                // When toggling out of HTML mode, parse the HTML back into the editor
                editor.commands.setContent(value || '');
              }
              setIsHtmlMode(!isHtmlMode);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              isHtmlMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isHtmlMode ? '</> Hide HTML' : '</> Edit HTML'}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {isHtmlMode ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full min-h-[400px] p-4 font-mono text-sm text-gray-800 focus:outline-none resize-none border-none flex-1"
            placeholder="Edit HTML directly..."
          />
        ) : (
          <EditorContent editor={editor} className="flex-1" />
        )}
      </div>

      {/* Character / Word Count Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex justify-between items-center text-[10px] sm:text-xs font-semibold text-gray-500">
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Press Release Body · {isHtmlMode ? (value || '').split(/\s+/).filter(w => w.trim()).length : editor.storage.characterCount.words()} words
        </span>
        <span className={`font-mono text-[11px] sm:text-xs px-2 py-0.5 rounded-full ${isCharacterLimitReached ? 'bg-red-50 text-red-600 font-bold border border-red-100' : 'bg-gray-100 text-gray-600'
          }`}>
          {isHtmlMode ? (value || '').length : editor.storage.characterCount.characters()} / {maxLength} chars
        </span>
      </div>
    </div>
  );
}

