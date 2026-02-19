import React, { Suspense } from 'react';

/**
 * SafeSuspense Component
 * Wraps content in a Suspense boundary with a fallback.
 * Critical for components using useSearchParams in Next.js.
 */
export default function SafeSuspense({
    children,
    fallback = <div className="animate-pulse h-10 w-full bg-white/5 rounded-lg" />
}: {
    children: React.ReactNode,
    fallback?: React.ReactNode
}) {
    return (
        <Suspense fallback={fallback}>
            {children}
        </Suspense>
    );
}
