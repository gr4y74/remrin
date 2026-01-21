import React from 'react';
import { cn } from '@/lib/utils';
import '@/components/aol-chat/styles/xp-theme.css';

interface XPInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const XPInput = React.forwardRef<HTMLInputElement, XPInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "bg-white border border-[#7f9db9] rounded-[2px] px-2 py-1 font-['Tahoma',_sans-serif] text-[12px]",
                    "shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]",
                    "outline-none focus:border-[var(--xp-blue-highlight)] focus:shadow-[0_0_0_2px_rgba(74,158,255,0.2)]",
                    "transition-shadow duration-100",
                    className
                )}
                {...props}
            />
        );
    }
);
XPInput.displayName = 'XPInput';
