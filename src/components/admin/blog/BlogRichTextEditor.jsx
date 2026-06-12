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

import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
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
    AlignJustify,
    Highlighter,
    Type,
    Minus,
    ChevronDown,
    Palette,
    Baseline,
    Image as ImageIcon,
    Trash2,
    Maximize,
    LayoutGrid
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useEffect, useState, useCallback } from "react";
import ImageUploadModal from "./ImageUploadModal";

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

const TextTransform = Extension.create({
    name: 'textTransform',
    addOptions() { return { types: ['textStyle'] }; },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    textTransform: {
                        default: null,
                        parseHTML: element => element.style.textTransform || null,
                        renderHTML: attributes => {
                            if (!attributes.textTransform) return {};
                            return { style: `text-transform: ${attributes.textTransform}` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setTextTransform: textTransform => ({ chain }) => chain().setMark('textStyle', { textTransform }).run(),
            unsetTextTransform: () => ({ chain }) => chain().setMark('textStyle', { textTransform: null }).removeEmptyTextStyle().run(),
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
                    return {
                        style: `width: ${attributes.width}; height: auto;`,
                    };
                },
            },
            textAlign: {
                default: 'left',
                parseHTML: element => element.style.textAlign || 'left',
                renderHTML: attributes => {
                    return {
                        style: `text-align: ${attributes.textAlign}`,
                    };
                },
            },
        };
    },
    addNodeView() {
        return ReactNodeViewRenderer(ImageNodeView);
    },
});

export const AsideNode = Node.create({
    name: "aside",
    group: "block",
    content: "block+",
    defining: true,
    addAttributes() {
        return {
            class: {
                default: null,
            },
        };
    },
    parseHTML() {
        return [
            { tag: "aside" },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["aside", HTMLAttributes, 0];
    },
});

export const SectionNode = Node.create({
    name: "section",
    group: "block",
    content: "block+",
    defining: true,
    addAttributes() {
        return {
            class: {
                default: null,
            },
        };
    },
    parseHTML() {
        return [
            { tag: "section" },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["section", HTMLAttributes, 0];
    },
});

export const DivNode = Node.create({
    name: "div",
    group: "block",
    content: "block+",
    defining: true,
    addAttributes() {
        return {
            class: {
                default: null,
            },
            style: {
                default: null,
            },
        };
    },
    parseHTML() {
        return [
            { tag: "div" },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ["div", HTMLAttributes, 0];
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
                ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            } disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

const ImageNodeView = (props) => {
    const { node, updateAttributes, selected, editor } = props;

    const handleAlign = (align) => {
        updateAttributes({ textAlign: align });
    };

    const handleWidth = (width) => {
        updateAttributes({ width });
    };

    const handleDelete = () => {
        editor.commands.deleteSelection();
    };

    return (
        <NodeViewWrapper className={`relative inline-block w-full transition-all duration-300 ${props.node.attrs.textAlign === 'center' ? 'text-center' : props.node.attrs.textAlign === 'right' ? 'text-right' : 'text-left'}`}>
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
                                <ToolbarButton onClick={() => handleAlign('left')} isActive={node.attrs.textAlign === 'left'} title="Align Left"><AlignLeft size={12} /></ToolbarButton>
                                <ToolbarButton onClick={() => handleAlign('center')} isActive={node.attrs.textAlign === 'center'} title="Align Center"><AlignCenter size={12} /></ToolbarButton>
                                <ToolbarButton onClick={() => handleAlign('right')} isActive={node.attrs.textAlign === 'right'} title="Align Right"><AlignRight size={12} /></ToolbarButton>
                            </div>

                            <ToolbarButton
                                onClick={handleDelete}
                                className="text-red-500 hover:bg-red-50"
                                title="Delete Image"
                            >
                                <Trash2 size={12} />
                            </ToolbarButton>
                        </div>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
};

const editorCss = `
    .ProseMirror { font-family: var(--font-serif), Georgia, serif; font-size: 1.125rem; line-height: 1.75; color: #1a1a2e; }
    .ProseMirror:focus { outline: none; }
    .ProseMirror h1 { font-size: 2.5rem; font-weight: 800; line-height: 1.15; margin-bottom: 1.5rem; color: #0a0e1a; letter-spacing: -0.02em; font-family: var(--font-serif), Georgia, serif; }
    .ProseMirror h2 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin: 3.5rem 0 0.85rem; padding-top: 0; border-top: none; color: #0a0e1a; letter-spacing: -0.02em; font-family: var(--font-serif), Georgia, serif; position: relative; }
    .ProseMirror h2::before { content: ''; display: block; width: 2.5rem; height: 3px; background: #0A5CFF; margin-bottom: 0.85rem; border-radius: 2px; }
    .ProseMirror h3 { font-size: 1.5rem; font-weight: 700; line-height: 1.2; margin: 2.25rem 0 0.75rem; color: #0a0e1a; letter-spacing: -0.01em; font-family: var(--font-serif), Georgia, serif; }
    .ProseMirror p { font-size: 1.125rem; line-height: 1.75; margin-bottom: 1.5rem; color: #2d3142; }
    .ProseMirror a { color: #0A5CFF; border-bottom: 1px solid rgba(10,92,255,0.3); text-decoration: none; cursor: pointer; }
    .ProseMirror a:hover { border-color: #0A5CFF; }
    .ProseMirror ul { list-style-type: disc; padding-left: 1.75rem; margin-bottom: 1.5rem; }
    .ProseMirror ol { list-style-type: decimal; padding-left: 1.75rem; margin-bottom: 1.5rem; }
    .ProseMirror li { margin-bottom: 0.75rem; color: #2d3142; }
    .ProseMirror blockquote { border-left: 4px solid #0A5CFF; padding: 1rem 1.5rem; font-style: italic; color: #4B5563; margin: 2rem 0; background: #f3f7ff; border-radius: 0 0.75rem 0.75rem 0; }
    .ProseMirror hr { border: none; border-top: 1px solid #d8d4c8; margin: 3rem 0; }
    .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; cursor: pointer; transition: all 0.2s; display: block; }
    .ProseMirror img.ProseMirror-selectednode { outline: 3px solid #0A5CFF; outline-offset: 4px; box-shadow: 0 0 20px rgba(10, 92, 255, 0.2); }

    /* Droppr Premium Editorial Blog Styles inside Editor */
    .ProseMirror > p:first-of-type::first-letter,
    .ProseMirror p.drop-cap::first-letter,
    .ProseMirror p.lede::first-letter { font-size: 4rem; float: left; line-height: 0.85; padding: 4px 8px 0 0; font-weight: 700; color: #0A5CFF; font-family: var(--font-serif), Georgia, serif; }
    .ProseMirror aside.pullquote { margin: 2rem 0; padding: 1.5rem 2rem; background: #f4f1ea; border-left: 6px solid #0A5CFF; font-family: var(--font-serif), Georgia, serif; }
    .ProseMirror p.pullquote-text { font-size: 26px; line-height: 1.35; color: #0a0e1a; font-style: italic; font-weight: 500; margin-bottom: 14px; letter-spacing: -0.01em; font-family: var(--font-serif), Georgia, serif; }
    .ProseMirror p.pullquote-attr { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; font-style: normal; font-weight: 600; margin-bottom: 0; }
    .ProseMirror p.pullquote-attr a { color: #5a5e6b; border-bottom: 1px solid #d8d4c8; }
    
    .ProseMirror .stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin: 2rem 0; padding: 1.5rem 0; border-top: 2px solid #0a0e1a; border-bottom: 2px solid #0a0e1a; }
    .ProseMirror .stat { text-align: left; }
    .ProseMirror .stat-num { font-size: 2.25rem; font-weight: 700; color: #0A5CFF; line-height: 1; margin-bottom: 0.5rem; font-family: var(--font-serif), Georgia, serif; }
    .ProseMirror .stat-label { font-family: sans-serif; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: #5a5e6b; line-height: 1.4; }
    
    .ProseMirror ol.step-list { counter-reset: step; margin: 2rem 0; padding: 0; list-style: none; }
    .ProseMirror ol.step-list li { counter-increment: step; position: relative; padding: 1rem 0 1rem 3.5rem; border-bottom: 1px solid #d8d4c8; }
    .ProseMirror ol.step-list li::before { content: counter(step, decimal-leading-zero); position: absolute; left: 0; top: 1rem; font-family: var(--font-serif), Georgia, serif; font-size: 1.75rem; font-weight: 700; color: #0A5CFF; }
    .ProseMirror ol.step-list li:last-child { border-bottom: none; }
    .ProseMirror ol.step-list h4 { font-size: 1.125rem; font-weight: 700; color: #0a0e1a; margin-bottom: 0.25rem; font-family: var(--font-serif), Georgia, serif; }
    .ProseMirror ol.step-list p { font-size: 0.95rem; color: #5a5e6b; margin-bottom: 0; line-height: 1.5; }
    
    .ProseMirror section.cta { margin: 3rem 0; padding: 2.5rem 2rem; background: #0a0e1a; color: #fafaf7; text-align: left; border-top: 6px solid #0A5CFF; border-radius: 0.5rem; }
    .ProseMirror section.cta .cta-kicker { font-family: sans-serif; font-size: 0.7rem; letter-spacing: 0.24em; text-transform: uppercase; color: #c9a961; font-weight: 700; margin-bottom: 1rem; }
    .ProseMirror section.cta .cta-headline { font-size: 1.875rem; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 1rem; color: #fafaf7; }
    .ProseMirror section.cta .cta-deck { font-size: 1.05rem; color: #c8ccd6; margin-bottom: 1.5rem; font-style: italic; }
    .ProseMirror section.cta .offer-stack { background: rgba(255,255,255,0.04); border-left: 3px solid #c9a961; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }
    .ProseMirror section.cta .offer-stack-title { font-family: sans-serif; font-size: 0.75rem; letter-spacing: 0.16em; text-transform: uppercase; color: #c9a961; margin-bottom: 1rem; font-weight: 700; }
    .ProseMirror section.cta .offer-list { list-style: none; padding: 0; margin-bottom: 0; }
    .ProseMirror section.cta .offer-list li { padding: 0.5rem 0 0.5rem 1.5rem; position: relative; font-size: 0.95rem; color: #fafaf7; font-family: var(--font-serif), Georgia, serif; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 0; }
    .ProseMirror section.cta .offer-list li:last-child { border-bottom: none; }
    .ProseMirror section.cta .offer-list li::before { content: "✓"; position: absolute; left: 0; color: #c9a961; font-weight: 700; font-family: sans-serif; }
    .ProseMirror section.cta .offer-list li .value { color: #c9a961; font-weight: 700; margin-left: 0.5rem; font-size: 0.85rem; font-family: sans-serif; }
    .ProseMirror section.cta .cta-buttons { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .ProseMirror section.cta .btn-primary { display: inline-block; padding: 0.75rem 1.5rem; background: #0A5CFF; color: #fafaf7; text-decoration: none; font-family: sans-serif; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; border: 2px solid #0A5CFF; transition: all 0.15s; }
    .ProseMirror section.cta .btn-primary:hover { background: #0047d4; border-color: #0047d4; }
    .ProseMirror section.cta .btn-secondary { display: inline-block; padding: 0.75rem 1.5rem; background: transparent; color: #fafaf7; text-decoration: none; font-family: sans-serif; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; border: 2px solid #fafaf7; transition: all 0.15s; }
    .ProseMirror section.cta .btn-secondary:hover { background: #fafaf7; color: #0a0e1a; }
`;

const FONT_SIZES = [
    { label: '12', value: '12px' },
    { label: '14', value: '14px' },
    { label: '16', value: '16px' },
    { label: '18', value: '18px' },
    { label: '20', value: '20px' },
    { label: '24', value: '24px' },
    { label: '28', value: '28px' },
    { label: '32', value: '32px' },
    { label: '36', value: '36px' },
    { label: '48', value: '48px' },
];

const COLOR_PALETTE = [
    { label: 'Default', value: '' },
    { label: 'Primary Blue', value: '#0A5CFF' },
    { label: 'Dark Navy', value: '#0a0e1a' },
    { label: 'Dark Gray', value: '#374151' },
    { label: 'Soft Gray', value: '#6B7280' },
    { label: 'Light Gray', value: '#D1D5DB' },
    { label: 'White', value: '#FFFFFF' },
    { label: 'Black', value: '#000000' },
    { label: 'Burgundy', value: '#6B1A14' },
    { label: 'Red', value: '#C0392B' },
    { label: 'Gold', value: '#C9A961' },
    { label: 'Orange', value: '#F59E0B' },
    { label: 'Green', value: '#10B981' },
    { label: 'Purple', value: '#8B5CF6' },
    { label: 'Teal', value: '#14B8A6' },
    { label: 'Cream', value: '#fafaf7' },
];

const MenuBar = ({ editor, showHtml, toggleHtml }) => {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
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
        if (!isTemplatesOpen && !isFontSizeOpen && !isColorOpen) return;
        const closeAll = () => {
            setIsTemplatesOpen(false);
            setIsFontSizeOpen(false);
            setIsColorOpen(false);
        };
        window.addEventListener('click', closeAll);
        return () => window.removeEventListener('click', closeAll);
    }, [isTemplatesOpen, isFontSizeOpen, isColorOpen]);

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

    if (!editor) {
        return null;
    }

    const insertTemplate = (type) => {
        let html = "";
        if (type === 'step-list') {
            html = `
                <ol class="step-list">
                    <li>
                        <h4>Audit your current citation share.</h4>
                        <p>Run 20–30 representative buyer queries across ChatGPT, Perplexity, Google AIO, and Claude. Record which sources are cited, which competitors appear, and which publications recur.</p>
                    </li>
                    <li>
                        <h4>Close the entity gap on your owned domain.</h4>
                        <p>Implement Organization, Article, and FAQPage schema. Standardize brand descriptors across directories and vertical-relevant surfaces.</p>
                    </li>
                </ol>
                <p></p>
            `;
        } else if (type === 'pullquote') {
            html = `
                <aside class="pullquote">
                    <p class="pullquote-text">"Ranking on page one of Google does not guarantee you will appear in AI answers. And appearing in AI answers does not require ranking on page one."</p>
                    <p class="pullquote-attr">— Hayden Hollis</p>
                </aside>
                <p></p>
            `;
        } else if (type === 'stats') {
            html = `
                <div class="stat-row">
                    <div class="stat">
                        <div class="stat-num">99%</div>
                        <div class="stat-label">of URLs cited in Google AI Overviews come from organic top 10 results.</div>
                    </div>
                    <div class="stat">
                        <div class="stat-num">87%</div>
                        <div class="stat-label">of ChatGPT citations correspond to top Bing results.</div>
                    </div>
                    <div class="stat">
                        <div class="stat-num">&lt;20%</div>
                        <div class="stat-label">overlap between top Google links and AI-cited sources.</div>
                    </div>
                </div>
                <p></p>
            `;
        } else if (type === 'cta') {
            html = `
                <section class="cta">
                    <div class="cta-kicker">Close the Citation Gap</div>
                    <h2 class="cta-headline" style="margin-top:0;">Be cited where the answers are written — not buried in the candidate set.</h2>
                    <p class="cta-deck">DropPR places your expertise on the publishers AI engines already cite. One upload becomes one editorially-written, publisher-hosted article.</p>
                    <div class="offer-stack">
                        <div class="offer-stack-title">Citation Acceleration Stack — Charter Cohort</div>
                        <ul class="offer-list">
                            <li>Editorial article structured for RAG extractability <span class="value">($1,200 value)</span></li>
                            <li>Placement on an AI-cited high-authority publisher <span class="value">($800 value)</span></li>
                            <li>Full schema markup and entity disambiguation <span class="value">($350 value)</span></li>
                        </ul>
                    </div>
                    <p style="font-size:14px; color:#c8ccd6; margin-bottom:8px; font-family:'Helvetica Neue', Arial, sans-serif;">Charter pricing from <strong style="color:#c9a961; font-size:18px;">$99</strong>.</p>
                    <div class="cta-buttons">
                        <a class="btn-primary" href="https://www.droppr.ai/get-started" target="_blank" rel="noopener">Run My Citation Audit →</a>
                        <a class="btn-secondary" href="https://www.droppr.ai/how-it-works" target="_blank" rel="noopener">See How It Works</a>
                    </div>
                </section>
                <p></p>
            `;
        }
        editor.chain().focus().insertContent(html).run();
    };

    const addLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const handleImageUpload = (url) => {
        editor.chain().focus().setImage({ src: url }).run();
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-1 p-2 border-b border-gray-100 bg-white sticky top-0 z-20 transition-all rounded-t-xl">
                {/* History */}
                <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-gray-100">
                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || showHtml} title="Undo">
                        <Undo size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || showHtml} title="Redo">
                        <Redo size={15} />
                    </ToolbarButton>
                </div>

                {/* Typography */}
                <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-gray-100">
                    <ToolbarButton
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        isActive={editor.isActive('paragraph')}
                        title="Paragraph"
                        className="w-10"
                    >
                        <span className="text-[12px] font-bold">P</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        isActive={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                        className="w-10"
                    >
                        <span className="text-[12px] font-bold">H1</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        isActive={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                        className="w-10"
                    >
                        <span className="text-[12px] font-bold">H2</span>
                    </ToolbarButton>
                    <ToolbarButton
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        isActive={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                        className="w-10"
                    >
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
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFontSizeOpen(!isFontSizeOpen);
                            setIsColorOpen(false);
                            setIsTemplatesOpen(false);
                        }}
                        disabled={showHtml}
                        className="flex items-center gap-1 px-2 h-8 rounded-md text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-all disabled:opacity-50 min-w-[52px] justify-center"
                        title="Font Size"
                    >
                        <Type size={12} />
                        <span className="text-[11px]">{getCurrentFontSize()}</span>
                        <ChevronDown size={10} />
                    </button>
                    {isFontSizeOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-28 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1 py-1.5 max-h-52 overflow-y-auto no-scrollbar">
                            <button
                                type="button"
                                onClick={() => {
                                    editor.chain().focus().unsetFontSize().run();
                                    setIsFontSizeOpen(false);
                                }}
                                className="w-full text-left px-3 py-1 text-xs font-bold text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Default
                            </button>
                            {FONT_SIZES.map((size) => (
                                <button
                                    key={size.value}
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().setFontSize(size.value).run();
                                        setIsFontSizeOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-1 text-xs font-bold rounded-lg transition-colors ${getCurrentFontSize() === size.label
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {size.label}px
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Text Color */}
                <div className="relative flex items-center pr-1 mr-1 border-r border-gray-100">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsColorOpen(!isColorOpen);
                            setIsFontSizeOpen(false);
                            setIsTemplatesOpen(false);
                        }}
                        disabled={showHtml}
                        className="flex items-center gap-1.5 px-2 h-8 rounded-md text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-all disabled:opacity-50"
                        title="Text Color"
                    >
                        <div className="relative">
                            <Palette size={13} />
                            <div
                                className="absolute -bottom-0.5 left-0 right-0 h-[3px] rounded-full"
                                style={{ backgroundColor: getCurrentColor() || '#374151' }}
                            />
                        </div>
                        <ChevronDown size={10} />
                    </button>
                    {isColorOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-[210px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 px-0.5">Text Color</p>
                            <div className="grid grid-cols-4 gap-2">
                                {COLOR_PALETTE.map((color) => (
                                    <button
                                        key={color.value || 'default'}
                                        type="button"
                                        title={color.label}
                                        onClick={() => {
                                            if (color.value === '') {
                                                editor.chain().focus().unsetColor().run();
                                            } else {
                                                editor.chain().focus().setColor(color.value).run();
                                            }
                                            setIsColorOpen(false);
                                        }}
                                        className={`relative w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 hover:shadow-md ${getCurrentColor() === color.value
                                                ? 'border-primary ring-2 ring-primary/30 scale-110 shadow-md'
                                                : color.value === '#0A5CFF'
                                                    ? 'border-blue-400 hover:border-primary'
                                                    : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                        style={{
                                            backgroundColor: color.value || '#f3f4f6',
                                            backgroundImage: color.value === '' ? 'linear-gradient(135deg, #f3f4f6 40%, #ef4444 40%, #ef4444 60%, #f3f4f6 60%)' : 'none',
                                        }}
                                    >
                                        {color.value === '#0A5CFF' && (
                                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center text-[7px] font-black text-blue-600 border border-blue-200 shadow-sm">★</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-2 px-0.5">
                                <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">★ = Brand Primary</span>
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

                {/* Utilities */}
                <div className="flex items-center gap-0.5 pr-1.5 mr-1 border-r border-gray-100">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} disabled={showHtml} title="Bullet List"><List size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} disabled={showHtml} title="Ordered List"><ListOrdered size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} disabled={showHtml} title="Quote"><Quote size={14} /></ToolbarButton>
                    <ToolbarButton onClick={addLink} isActive={editor.isActive("link")} disabled={showHtml} title="Link"><LinkIcon size={14} /></ToolbarButton>
                    <ToolbarButton onClick={() => setIsImageModalOpen(true)} disabled={showHtml} title="Insert Image" className="text-primary hover:bg-primary/5">
                        <ImageIcon size={14} />
                    </ToolbarButton>
                </div>

                {/* Templates */}
                <div className="relative flex items-center pr-1.5 mr-1 border-r border-gray-100">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsTemplatesOpen(!isTemplatesOpen);
                        }}
                        disabled={showHtml}
                        className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-all disabled:opacity-50"
                        title="Insert Editorial Template"
                    >
                        <LayoutGrid size={13} />
                        Templates
                        <ChevronDown size={11} />
                    </button>
                    {isTemplatesOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1 py-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-100">
                            <button
                                type="button"
                                onClick={() => {
                                    insertTemplate('step-list');
                                    setIsTemplatesOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Playbook Step-List
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    insertTemplate('pullquote');
                                    setIsTemplatesOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Pullquote
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    insertTemplate('stats');
                                    setIsTemplatesOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Stats Row
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    insertTemplate('cta');
                                    setIsTemplatesOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Citation Gap CTA
                            </button>
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
                title="Upload Blog Image"
                aspectRatio={16 / 9}
            />
        </>
    );
};

export default function BlogRichTextEditor({ value, onChange, placeholder }) {
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
            TextTransform,
            AsideNode,
            SectionNode,
            DivNode,
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
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white transition-all shadow-sm w-full">
            <style dangerouslySetInnerHTML={{ __html: editorCss }} />
            <MenuBar editor={editor} showHtml={showHtml} toggleHtml={() => setShowHtml(!showHtml)} />
            <div className="max-h-[600px] overflow-y-auto no-scrollbar scroll-smooth">

                {showHtml ? (
                    <textarea
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            if (editor) {
                                editor.commands.setContent(e.target.value);
                            }
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
