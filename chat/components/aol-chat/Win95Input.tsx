import React from 'react';
import { cn } from '@/lib/utils';

interface Win95InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Win95Input = React.forwardRef<HTMLInputElement, Win95InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "bg-white border-2 border-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-1 font-['Courier_New',_monospace] text-[12px] outline-none shadow-[inset_1px_1px_0px_0px_#000000]",
                    className
                )}
                {...props}
            />
        );
    }
);
Win95Input.displayName = 'Win95Input';
