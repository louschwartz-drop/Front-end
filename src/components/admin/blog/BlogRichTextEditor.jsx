"use client";

import { useEditor, EditorContent, Extension, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
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
    Maximize
} from "lucide-react";
import Button from "@/components/ui/Button";
import { useEffect, useState, useCallback } from "react";
import ImageUploadModal from "./ImageUploadModal";

// --- Custom Extensions ---

const CustomTextStyle = TextStyle.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            fontSize: {
                default: null,
                parseHTML: element => element.style.fontSize,
                renderHTML: attributes => {
                    if (!attributes.fontSize) {
                        return {};
                    }
                    return { style: `font-size: ${attributes.fontSize}` };
                },
            },
            textTransform: {
                default: null,
                parseHTML: element => element.style.textTransform,
                renderHTML: attributes => {
                    if (!attributes.textTransform) {
                        return {};
                    }
                    return { style: `text-transform: ${attributes.textTransform}` };
                },
            },
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
        className={`flex items-center justify-center h-8 w-8 rounded-md transition-all ${
            isActive 
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

const NodeStyles = Extension.create({
    name: 'nodeStyles',
    addGlobalAttributes() {
        return [];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
            setTextTransform: textTransform => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { textTransform })
                    .run();
            },
            unsetTextTransform: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { textTransform: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});

// --- Editor Content CSS ---
const editorCss = `
    .ProseMirror { font-family: var(--font-geist-sans), sans-serif; }
    .ProseMirror h1 { font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-bottom: 1.5rem; color: #111; }
    .ProseMirror h2 { font-size: 1.875rem; font-weight: 700; margin-bottom: 1.25rem; color: #222; }
    .ProseMirror h3 { font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: #333; }
    .ProseMirror p { font-size: 1rem; line-height: 1.625; margin-bottom: 1.25rem; color: #374151; }
    .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
    .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
    .ProseMirror li { margin-bottom: 0.5rem; }
    .ProseMirror blockquote { border-left: 4px solid #0A5CFF; padding-left: 1.5rem; font-style: italic; color: #4B5563; margin: 2rem 0; background: #f3f7ff; padding-top: 1rem; padding-bottom: 1rem; border-radius: 0 0.75rem 0.75rem 0; }
    .ProseMirror hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
    .ProseMirror img { max-width: 100%; height: auto; border-radius: 1rem; margin: 2rem 0; cursor: pointer; transition: all 0.2s; display: block; }
    .ProseMirror img.ProseMirror-selectednode { outline: 3px solid #0A5CFF; outline-offset: 4px; box-shadow: 0 0 20px rgba(10, 92, 255, 0.2); }
`;

const MenuBar = ({ editor, showHtml, toggleHtml }) => {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [_, setUpdate] = useState(0);

    useEffect(() => {
        if (!editor) return;
        const handler = () => setUpdate(prev => prev + 1);
        editor.on('transaction', handler);
        return () => editor.off('transaction', handler);
    }, [editor]);

    if (!editor) {
        return null;
    }

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
            <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-gray-100 bg-white sticky top-0 z-20 transition-all rounded-t-xl">
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
                </div>

                {/* Formatting */}
                <div className="flex items-center gap-0.5 pr-1 mr-1 border-r border-gray-100">
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} disabled={showHtml} title="Bold"><Bold size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} disabled={showHtml} title="Italic"><Italic size={16} /></ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} disabled={showHtml} title="Underline"><UnderlineIcon size={16} /></ToolbarButton>
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
            CustomTextStyle,
            Color,
            NodeStyles,
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
                class: "prose prose-blue max-w-none p-6 min-h-[350px] focus:outline-none selection:bg-primary/20",
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
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white transition-all shadow-sm">
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
