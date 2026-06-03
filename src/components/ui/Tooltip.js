"use client";

import { useState, useRef, useEffect, cloneElement, Children } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function Tooltip({ children, text, position = "top", delay = 200 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, currentPos: position });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleMouseEnter = (e) => {
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
    
    // Call original onMouseEnter if exists
    try {
      const child = Children.only(children);
      if (child.props && child.props.onMouseEnter) {
        child.props.onMouseEnter(e);
      }
    } catch(err) {}
  };

  const handleMouseLeave = (e) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
    
    // Call original onMouseLeave if exists
    try {
      const child = Children.only(children);
      if (child.props && child.props.onMouseLeave) {
        child.props.onMouseLeave(e);
      }
    } catch(err) {}
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    
    let currentPos = position;
    
    // Smart Positioning Check
    if (currentPos === "top" && rect.top < 40) currentPos = "bottom";
    if (currentPos === "bottom" && rect.bottom > window.innerHeight - 40) currentPos = "top";
    if (currentPos === "left" && rect.left < 100) currentPos = "right";
    if (currentPos === "right" && rect.right > window.innerWidth - 100) currentPos = "left";

    let x = rect.left + rect.width / 2;
    let y = rect.top - 8; 

    if (currentPos === "bottom") {
      y = rect.bottom + 8;
    } else if (currentPos === "left") {
      x = rect.left - 8;
      y = rect.top + rect.height / 2;
    } else if (currentPos === "right") {
      x = rect.right + 8;
      y = rect.top + rect.height / 2;
    }

    let align = "center";
    // Horizontal bounds clamp for top/bottom positions
    if (currentPos === "top" || currentPos === "bottom") {
      if (x < 120) {
        align = "left";
        x = Math.max(10, rect.left);
      } else if (x > window.innerWidth - 120) {
        align = "right";
        x = Math.min(window.innerWidth - 10, rect.right);
      }
    }

    setCoords({ x, y, currentPos, align });
  };

  useEffect(() => {
    if (!isVisible) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible]);

  let trigger;
  try {
    const child = Children.only(children);
    trigger = cloneElement(child, {
      ref: (node) => {
        triggerRef.current = node;
        const { ref } = child;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    });
  } catch (e) {
    // Fallback if children is not a single valid React element
    trigger = (
      <div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="inline-block">
        {children}
      </div>
    );
  }

  return (
    <>
      {trigger}
      {mounted && createPortal(
        <AnimatePresence>
          {isVisible && text && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: coords.currentPos === "top" ? 4 : coords.currentPos === "bottom" ? -4 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} // smooth ease-out
              className="fixed z-[99999] pointer-events-none px-3 py-2 text-xs font-medium text-white/90 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] tracking-wide max-w-[260px] text-center leading-relaxed"
              style={{
                left: coords.x,
                top: coords.y,
                transform: coords.currentPos === "top" || coords.currentPos === "bottom" 
                  ? `translate(${coords.align === "left" ? "0%" : coords.align === "right" ? "-100%" : "-50%"}, ${coords.currentPos === "top" ? "-100%" : "0"})` 
                  : `translate(${coords.currentPos === "left" ? "-100%" : "0"}, -50%)`
              }}
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
