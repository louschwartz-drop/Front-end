"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

export default function TableOfContents({ contentSelector = ".prose" }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    // Wait a brief moment for the DOM to render dangerouslySetInnerHTML
    const timer = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll(`${contentSelector} h2, ${contentSelector} h3`));
      
      const parsedHeadings = elements.map((el, index) => {
        const text = el.innerText;
        // Generate an ID if it doesn't have one
        let id = el.id;
        if (!id) {
          id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `heading-${index}`;
          el.id = id;
        }
        return {
          id,
          text,
          level: el.tagName === "H3" ? 3 : 2,
        };
      });

      setHeadings(parsedHeadings);

      // Intersection Observer for active heading
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: "-20% 0% -60% 0%" }
      );

      elements.forEach((el) => observer.observe(el));

      return () => {
        elements.forEach((el) => observer.unobserve(el));
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [contentSelector]);

  const handleClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Smooth scroll to the element, accounting for fixed headers
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (headings.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Table of Contents</h3>
      <ul className="space-y-4 text-sm font-medium text-gray-600">
        {headings.map((heading) => (
          <li 
            key={heading.id} 
            className={heading.level === 3 ? "pl-4" : ""}
          >
            <a 
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={`transition-colors flex items-center gap-2 ${
                activeId === heading.id 
                  ? "text-primary font-bold" 
                  : "hover:text-primary"
              }`}
            >
              {activeId === heading.id && <ChevronRight size={14} className="text-primary flex-shrink-0" />}
              <span className={activeId === heading.id ? "" : (heading.level === 3 ? "" : "pl-5")}>
                {heading.text}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
