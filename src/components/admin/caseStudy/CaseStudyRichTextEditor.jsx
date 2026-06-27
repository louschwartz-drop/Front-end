"use client";

import { useEditor, EditorContent, Extension, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Code,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Type,
    ChevronDown,
    Palette,
    Image as ImageIcon,
    Trash2,
    Minus,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import ImageUploadModal from "../blog/ImageUploadModal";

// --- Custom Extensions ---

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() { return { types: ['textStyle'] }; },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize || null,
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => chain().setMark('textStyle', { fontSize }).run(),
            unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
        };
    },
});

const ResizableImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '100%',
                parseHTML: element => element.style.width || element.getAttribute('width'),
                renderHTML: attributes => {
                    return { style: `width: ${attributes.width}; height: auto;` };
                },
            },
            textAlign: {
                default: 'left',
                parseHTML: element => element.style.textAlign || 'left',
                renderHTML: attributes => {
                    return { style: `text-align: ${attributes.textAlign}` };
                },
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
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

const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
    disabled = false,
    title,
    className = ""
}) => (
    <button
        type="button"
        onClick={(e) => {
            e.preventDefault();
            onClick();
        }}
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        title={title}
        className={`flex items-center justify-center h-8 w-8 rounded-md transition-all ${isActive
                ? "bg-blue-100 text-blue-700 ring-2 ring-blue-500 shadow-sm font-bold"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            } disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const ImageNodeView = (props) => {
    const { node, updateAttributes, selected, editor } = props;

    return (
        <NodeViewWrapper className={`relative inline-block w-full transition-all duration-300 ${node.attrs.textAlign === 'center' ? 'text-center' : node.attrs.textAlign === 'right' ? 'text-right' : 'text-left'}`}>
            <div className="relative inline-block group" style={{ width: node.attrs.width }}>
                <img
                    src={node.attrs.src || null}
                    alt={node.attrs.alt}
                    title={node.attrs.title}
                    className={`rounded-xl max-w-full shadow-md transition-all duration-300 ${selected ? 'ring-4 ring-primary ring-offset-4' : ''}`}
                />
                {selected && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-auto">
                        <div className="flex items-center gap-1 p-1 bg-white/90 border border-gray-200 rounded-xl shadow-2xl ring-1 ring-black/5 backdrop-blur-md">
                            <div className="flex items-center gap-0.5 px-1 border-r border-gray-100">
                                <ToolbarButton onClick={() => updateAttributes({ textAlign: 'left' })} isActive={node.attrs.textAlign === 'left'} title="Left"><AlignLeft size={12} /></ToolbarButton>
                                <ToolbarButton onClick={() => updateAttributes({ textAlign: 'center' })} isActive={node.attrs.textAlign === 'center'} title="Center"><AlignCenter size={12} /></ToolbarButton>
                                <ToolbarButton onClick={() => updateAttributes({ textAlign: 'right' })} isActive={node.attrs.textAlign === 'right'} title="Right"><AlignRight size={12} /></ToolbarButton>
                            </div>
                            <ToolbarButton onClick={() => editor.commands.deleteSelection()} className="text-red-500 hover:bg-red-50" title="Delete"><Trash2 size={12} /></ToolbarButton>
                        </div>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
};

const editorCss = `
    .case-study-editor .ProseMirror { font-family: var(--font-serif), Georgia, serif; font-size: 1.125rem; line-height: 1.75; color: #1a1a2e; }
    .case-study-editor .ProseMirror:focus { outline: none; }
    .case-study-editor .ProseMirror h1 { font-size: 2.5rem; font-weight: 800; line-height: 1.15; margin-bottom: 1.5rem; color: #0a0e1a; letter-spacing: -0.02em; }
    .case-study-editor .ProseMirror h2 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin: 3.5rem 0 0.85rem; color: #0a0e1a; letter-spacing: -0.02em; position: relative; padding-left: 1rem; border-left: 4px solid var(--color-primary, #0A5CFF); padding-bottom: 0.5rem; }
    .case-study-editor .ProseMirror h3 { font-size: 1.5rem; font-weight: 700; line-height: 1.2; margin: 2.25rem 0 0.75rem; color: #0a0e1a; letter-spacing: -0.01em; }
    .case-study-editor .ProseMirror p { font-size: 1.125rem; line-height: 1.75; margin-bottom: 1.5rem; color: #2d3142; }
    .case-study-editor .ProseMirror a { color: var(--color-primary, #0A5CFF); border-bottom: 1px solid rgba(10,92,255,0.3); text-decoration: none; cursor: pointer; }
    .case-study-editor .ProseMirror ul { list-style-type: disc; padding-left: 1.75rem; margin-bottom: 1.5rem; }
    .case-study-editor .ProseMirror ol { list-style-type: decimal; padding-left: 1.75rem; margin-bottom: 1.5rem; }
    .case-study-editor .ProseMirror li { margin-bottom: 0.75rem; color: #2d3142; }
    .case-study-editor .ProseMirror blockquote { border-left: 4px solid var(--color-primary, #0A5CFF); padding: 1rem 1.5rem; font-style: italic; color: #4B5563; margin: 2rem 0; background: #f3f7ff; border-radius: 0 0.75rem 0.75rem 0; }
    .case-study-editor .ProseMirror hr { border: none; border-top: 1px solid #d8d4c8; margin: 3rem 0; }
    .case-study-editor .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; cursor: pointer; transition: all 0.2s; display: block; }
    .case-study-editor .ProseMirror img.ProseMirror-selectednode { outline: 3px solid var(--color-primary, #0A5CFF); outline-offset: 4px; }
    .case-study-editor .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1.5rem 0; overflow: hidden; }
    .case-study-editor .ProseMirror table td, .case-study-editor .ProseMirror table th { min-width: 1em; border: 1px solid #d1d5db; padding: 8px 12px; vertical-align: top; box-sizing: border-box; position: relative; }
    .case-study-editor .ProseMirror table th { font-weight: bold; text-align: left; background-color: #f3f4f6; }
    .case-study-editor .ProseMirror .selectedCell:after { z-index: 2; position: absolute; content: ""; left: 0; right: 0; top: 0; bottom: 0; background: rgba(200, 200, 255, 0.4); pointer-events: none; }
    .case-study-editor .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #adf; pointer-events: none; }
`;

const FONT_SIZES = [
    { label: '12', value: '12px' }, { label: '14', value: '14px' }, { label: '16', value: '16px' },
    { label: '18', value: '18px' }, { label: '20', value: '20px' }, { label: '24', value: '24px' },
    { label: '28', value: '28px' }, { label: '32', value: '32px' }, { label: '36', value: '36px' },
    { label: '48', value: '48px' },
];

const COLOR_PALETTE = [
    { label: 'Default', value: '' }, { label: 'Primary Blue', value: '#0A5CFF' },
    { label: 'Dark Navy', value: '#0a0e1a' }, { label: 'Dark Gray', value: '#374151' },
    { label: 'Soft Gray', value: '#6B7280' }, { label: 'Red', value: '#C0392B' },
    { label: 'Green', value: '#10B981' }, { label: 'Gold', value: '#C9A961' },
    { label: 'Black', value: '#000000' }, { label: 'White', value: '#FFFFFF' },
];

const MenuBar = ({ editor, showHtml, toggleHtml }) => {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
    const [isColorOpen, setIsColorOpen] = useState(false);
    const [_, setUpdate] = useState(0);

    useEffect(() => {
        if (!editor) return;
        const handler = () => setUpdate(prev => prev + 1);
        editor.on('transaction', handler);
        return () => editor.off('transaction', handler);
    }, [editor]);

    useEffect(() => {
        if (!isFontSizeOpen && !isColorOpen) return;
        const closeAll = () => { setIsFontSizeOpen(false); setIsColorOpen(false); };
        window.addEventListener('click', closeAll);
        return () => window.removeEventListener('click', closeAll);
    }, [isFontSizeOpen, isColorOpen]);

    const getCurrentFontSize = () => {
        if (!editor) return '16';
        const attrs = editor.getAttributes('textStyle');
        return attrs.fontSize ? parseInt(attrs.fontSize) : '16';
    };

    const getCurrentColor = () => {
        if (!editor) return '';
        const attrs = editor.getAttributes('textStyle');
        return attrs.color || '';
    };

    if (!editor) return null;

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleImageUpload = (url) => {
        editor.chain().focus().setImage({ src: url }).run();
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-1 p-2 border-b border-gray-100 bg-white sticky top-0 z-20 transition-all rounded-t-xl">
                {/* History */}
                <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-gray-100">
                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || showHtml} title="Undo"><Undo size={15} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || showHtml} title="Redo"><Redo size={15} /></ToolbarButton>
                </div>

                {/* Typography */}
                <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-gray-100">
                    <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} title="Paragraph" className="w-10">
                        <span className="text-[12px] font-bold">P</span>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1" className="w-10">
                        <span className="text-[12px] font-bold">H1</span>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2" className="w-10">
                        <span className="text-[12px] font-bold">H2</span>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3" className="w-10">
                        <span className="text-[12px] font-bold">H3</span>
                    </ToolbarButton>
                </div>

                {/* Formatting */}
                <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-gray-100">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} disabled={showHtml} title="Bold"><Bold size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} disabled={showHtml} title="Italic"><Italic size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} disabled={showHtml} title="Underline"><UnderlineIcon size={16} /></ToolbarButton>
                </div>

                {/* Font Size */}
                <div className="relative flex items-center pr-1 mr-1 border-r border-gray-100">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsFontSizeOpen(!isFontSizeOpen); setIsColorOpen(false); }} disabled={showHtml}
                        className="flex items-center gap-1 px-2 h-8 rounded-md text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-all disabled:opacity-50 min-w-[52px] justify-center" title="Font Size">
                        <Type size={12} /><span className="text-[11px]">{getCurrentFontSize()}</span><ChevronDown size={10} />
                    </button>
                    {isFontSizeOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-28 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1 py-1.5 max-h-52 overflow-y-auto no-scrollbar">
                            <button type="button" onClick={() => { editor.chain().focus().unsetFontSize().run(); setIsFontSizeOpen(false); }}
                                className="w-full text-left px-3 py-1 text-xs font-bold text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">Default</button>
                            {FONT_SIZES.map((size) => (
                                <button key={size.value} type="button" onClick={() => { editor.chain().focus().setFontSize(size.value).run(); setIsFontSizeOpen(false); }}
                                    className={`w-full text-left px-3 py-1 text-xs font-bold rounded-lg transition-colors ${getCurrentFontSize() === size.label ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}>
                                    {size.label}px
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Text Color */}
                <div className="relative flex items-center pr-1 mr-1 border-r border-gray-100">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setIsColorOpen(!isColorOpen); setIsFontSizeOpen(false); }} disabled={showHtml}
                        className="flex items-center gap-1.5 px-2 h-8 rounded-md text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-all disabled:opacity-50" title="Text Color">
                        <div className="relative"><Palette size={13} /><div className="absolute -bottom-0.5 left-0 right-0 h-[3px] rounded-full" style={{ backgroundColor: getCurrentColor() || '#374151' }} /></div>
                        <ChevronDown size={10} />
                    </button>
                    {isColorOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-[210px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">Text Color</p>
                            <div className="grid grid-cols-5 gap-2">
                                {COLOR_PALETTE.map((color) => (
                                    <button key={color.value || 'default'} type="button" title={color.label}
                                        onClick={() => { color.value === '' ? editor.chain().focus().unsetColor().run() : editor.chain().focus().setColor(color.value).run(); setIsColorOpen(false); }}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${getCurrentColor() === color.value ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-gray-200 hover:border-gray-400'}`}
                                        style={{ backgroundColor: color.value || '#f3f4f6', backgroundImage: color.value === '' ? 'linear-gradient(135deg, #f3f4f6 40%, #ef4444 40%, #ef4444 60%, #f3f4f6 60%)' : 'none' }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-0.5 pr-1.5 mr-1 border-r border-gray-100">
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} disabled={showHtml} title="Left"><AlignLeft size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} disabled={showHtml} title="Center"><AlignCenter size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} disabled={showHtml} title="Right"><AlignRight size={14} /></ToolbarButton>
                </div>

                {/* Lists, Quote, Link, Image, Table */}
                <div className="flex items-center gap-0.5 pr-1.5 mr-1 border-r border-gray-100">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} disabled={showHtml} title="Bullet List"><List size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} disabled={showHtml} title="Ordered List"><ListOrdered size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} disabled={showHtml} title="Quote"><Quote size={14} /></ToolbarButton>
                    <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} disabled={showHtml} title="Link"><LinkIcon size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => setIsImageModalOpen(true)} disabled={showHtml} title="Insert Image" className="text-primary hover:bg-primary/5"><ImageIcon size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={showHtml} title="Horizontal Rule"><Minus size={14} /></ToolbarButton>
                </div>

                {/* Table Controls */}
                <div className="flex items-center gap-0.5 pr-1.5 mr-1 border-r border-gray-100">
                    <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        disabled={showHtml || editor.isActive('table')}
                        className={`flex items-center gap-1 px-2 h-8 rounded-md text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-all disabled:opacity-30 ${editor.isActive('table') ? 'hidden' : ''}`}
                        title="Insert Table">
                        <span className="text-[11px]">+ Table</span>
                    </button>
                    {editor.isActive('table') && !showHtml && (
                        <div className="flex items-center gap-0.5 bg-blue-50/50 p-0.5 rounded-lg border border-blue-100">
                            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-1.5 py-1 rounded text-blue-600 hover:bg-blue-100 transition-all text-[10px] font-bold">+ Row</button>
                            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-1.5 py-1 rounded text-blue-600 hover:bg-blue-100 transition-all text-[10px] font-bold">+ Col</button>
                            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-1.5 py-1 rounded text-red-500 hover:bg-red-100 transition-all text-[10px] font-bold">- Row</button>
                            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-1.5 py-1 rounded text-red-500 hover:bg-red-100 transition-all text-[10px] font-bold">- Col</button>
                            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="p-1 rounded text-red-600 hover:bg-red-100 transition-all"><Trash2 size={12} /></button>
                        </div>
                    )}
                </div>

                {/* HTML Source Toggle */}
                <div className="flex items-center gap-0.5 ml-auto">
                    <ToolbarButton onClick={toggleHtml} isActive={showHtml} title="View HTML Source" className={showHtml ? "ring-1 ring-primary/20" : ""}><Code size={14} /></ToolbarButton>
                </div>
            </div>

            <ImageUploadModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onUploadSuccess={handleImageUpload}
                title="Upload Case Study Image"
                aspectRatio={16 / 9}
                disableCrop={true}
            />
        </>
    );
};

export default function CaseStudyRichTextEditor({ value, onChange, placeholder }) {
    const [mounted, setMounted] = useState(false);
    const [showHtml, setShowHtml] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                paragraph: { HTMLAttributes: { class: "mb-4" } }
            }),
            Underline,
            TextStyle,
            Color,
            FontSize,
            ResizableImage.configure({
                HTMLAttributes: {
                    class: 'rounded-xl max-w-full shadow-md my-6 transition-all duration-300',
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-primary underline cursor-pointer font-bold' },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),
            Highlight.configure({
                multicolor: true,
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
        immediatelyRender: false,
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-blue max-w-none p-3 sm:p-6 min-h-[280px] sm:min-h-[350px] focus:outline-none selection:bg-primary/20",
            },
        },
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!mounted) {
        return <div className="border border-gray-200 rounded-xl h-[400px] bg-gray-50/50 animate-pulse" />;
    }

    return (
        <div className="case-study-editor border border-gray-200 rounded-xl overflow-hidden bg-white transition-all shadow-sm w-full">
            <style dangerouslySetInnerHTML={{ __html: editorCss }} />
            <MenuBar editor={editor} showHtml={showHtml} toggleHtml={() => setShowHtml(!showHtml)} />
            <div className="max-h-[600px] overflow-y-auto no-scrollbar scroll-smooth">
                {showHtml ? (
                    <textarea
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            if (editor) { editor.commands.setContent(e.target.value); }
                        }}
                        className="w-full h-[400px] p-6 font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none resize-none no-scrollbar leading-relaxed"
                        placeholder="Paste or write your HTML here..."
                    />
                ) : (
                    <EditorContent editor={editor} />
                )}
            </div>
        </div>
    );
}
