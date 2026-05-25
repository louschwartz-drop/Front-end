"use client";

import { useState, useEffect } from "react";

export default function FallbackImage({ src, fallbackSrc, alt, className }) {
    const getInitialSrc = () => (!src || src === "None" || src === "") ? fallbackSrc : src;
    const [imgSrc, setImgSrc] = useState(getInitialSrc());
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(getInitialSrc());
        setHasError(false);
    }, [src, fallbackSrc]);

    return (
        <img
            src={hasError ? fallbackSrc : imgSrc}
            alt={alt}
            className={className}
            onError={(e) => {
                setHasError(true);
                // Also prevent infinite loop if the fallback itself is broken
                e.target.onerror = null; 
            }}
        />
    );
}
