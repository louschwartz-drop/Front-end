'use client';

import { useEffect, useState } from 'react';

export const TableFloatingMenu = ({ editor }) => {
  const [style, setStyle] = useState({ opacity: 0, visibility: 'hidden', pointerEvents: 'none' });

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      if (!editor.isActive('table')) {
        setStyle({ opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
        return;
      }

      try {
        const { view } = editor;
        const { selection } = view.state;
        let node = view.domAtPos(selection.from).node;
        const element = node instanceof Element ? node : node.parentElement;
        const table = element?.closest('table');
        const container = view.dom.parentElement;

        if (table && container) {
          const tableRect = table.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          const top = tableRect.top - containerRect.top + container.scrollTop - 45;
          const right = containerRect.right - tableRect.right;

          setStyle({
            opacity: 1,
            visibility: 'visible',
            pointerEvents: 'auto',
            top: `${Math.max(0, top)}px`,
            right: `${Math.max(0, right)}px`,
          });
          return;
        }
      } catch (e) {}

      setStyle({ opacity: 0, visibility: 'hidden', pointerEvents: 'none' });
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('update', updateMenu);
    
    // Initial position check
    setTimeout(updateMenu, 50);

    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('update', updateMenu);
    };
  }, [editor]);

  return (
    <div 
      style={{ ...style, transition: 'opacity 0.2s ease, visibility 0.2s ease' }} 
      className="absolute flex items-center gap-1 bg-white p-1.5 rounded-xl border border-gray-200 shadow-xl z-50"
    >
      <button type="button" onClick={() => editor.chain().focus().toggleHeaderRow().run()} onMouseDown={(e) => e.preventDefault()} className="px-2 py-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all text-xs font-bold" title="Toggle Header Row">H</button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} onMouseDown={(e) => e.preventDefault()} className="px-2 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all text-xs font-bold" title="Add Row Below">+ Row</button>
      <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} onMouseDown={(e) => e.preventDefault()} className="px-2 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all text-xs font-bold" title="Add Column Right">+ Col</button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} onMouseDown={(e) => e.preventDefault()} className="px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all text-xs font-bold" title="Delete Row">- Row</button>
      <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} onMouseDown={(e) => e.preventDefault()} className="px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all text-xs font-bold" title="Delete Column">- Col</button>
      <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} onMouseDown={(e) => e.preventDefault()} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all ml-1" title="Delete Entire Table">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  );
};
