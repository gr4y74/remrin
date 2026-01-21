'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useSafeAreaInsets } from '@/hooks/useMobileDetection';

interface MobileLayoutProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    bottomNav?: React.ReactNode;
    className?: string;
}

/**
 * Mobile-first layout wrapper
 * Provides header, scrollable content area, and bottom navigation
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
    children,
    header,
    bottomNav,
    className
}) => {
    const insets = useSafeAreaInsets();

    return (
        <div
            className={cn(
                "h-screen w-full flex flex-col bg-gradient-to-b from-[#5e2b8d] to-[#7b4ea3] overflow-hidden",
                className
            )}
            style={{
                paddingTop: insets.top,
                paddingBottom: insets.bottom
            }}
        >
            {/* Header */}
            {header && (
                <div className="flex-shrink-0 z-50">
                    {header}
                </div>
            )}

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {children}
            </div>

            {/* Bottom Navigation */}
            {bottomNav && (
                <div className="flex-shrink-0 z-50">
                    {bottomNav}
                </div>
            )}
        </div>
    );
};
