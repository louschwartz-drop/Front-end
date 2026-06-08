import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium text-muted-foreground animate-pulse">
                Loading Press Releases...
            </p>
        </div>
    );
}
