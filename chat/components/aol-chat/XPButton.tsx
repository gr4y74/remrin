import React from 'react';
import { cn } from '@/lib/utils';
import '@/components/aol-chat/styles/xp-theme.css';

interface XPButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'normal';
}

export const XPButton = React.forwardRef<HTMLButtonElement, XPButtonProps>(
    ({ className, variant = 'normal', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "relative overflow-hidden font-['Tahoma',_sans-serif] text-[11px] px-4 py-1 rounded-[3px] transition-all duration-75",
                    "border border-[var(--xp-button-border)] shadow-sm",
                    "bg-[image:var(--xp-button-bg)] hover:bg-[image:var(--xp-button-hover)]",
                    "active:translate-y-[1px] active:shadow-inner",
                    "focus:outline-none focus:ring-1 focus:ring-[var(--xp-blue-highlight)] focus:ring-offset-1 focus:ring-offset-[var(--xp-window-bg)]",
                    variant === 'primary' && "font-bold",
                    className
                )}
                {...props}
            />
        );
    }
);
XPButton.displayName = 'XPButton';
