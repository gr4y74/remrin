import React from 'react';
import { cn } from '@/lib/utils';

interface Win95ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
}

export const Win95Button = React.forwardRef<HTMLButtonElement, Win95ButtonProps>(
    ({ className, active, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "bg-[#c0c0c0] border-2 border-[#ffffff] border-r-[#808080] border-b-[#808080] text-black font-['MS_Sans_Serif',_Arial,_sans-serif] text-[11px] px-4 py-1 active:border-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] active:translate-x-[1px] active:translate-y-[1px] outline-none focus:outline-black focus:outline-dotted focus:outline-1 focus:-outline-offset-2",
                    active && "border-[#808080] border-r-[#ffffff] border-b-[#ffffff] translate-x-[1px] translate-y-[1px]",
                    className
                )}
                style={{ boxShadow: active ? 'none' : '1px 1px 0px 0px #000000' }}
                {...props}
            />
        );
    }
);
Win95Button.displayName = 'Win95Button';
