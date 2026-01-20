import React from 'react';
import { cn } from '@/lib/utils';

interface Win95WindowProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    icon?: string;
    onClose?: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    isActive?: boolean;
}

export const Win95Window = React.forwardRef<HTMLDivElement, Win95WindowProps>(
    ({ className, title, icon, children, onClose, onMinimize, onMaximize, isActive = true, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-[#c0c0c0] border-2 border-[#ffffff] border-r-[#808080] border-b-[#808080] p-[2px] shadow-[1px_1px_0px_0px_#000000]",
                    className
                )}
                {...props}
            >
                {/* Title Bar */}
                <div
                    className={cn(
                        "flex justify-between items-center px-1 py-[2px] mb-[2px]",
                        isActive
                            ? "bg-gradient-to-r from-[#000080] to-[#1084d0] text-white"
                            : "bg-[#808080] text-[#c0c0c0]"
                    )}
                >
                    <div className="flex items-center gap-1 font-bold text-[11px] select-none">
                        {icon && <img src={icon} alt="" className="w-4 h-4" />}
                        <span>{title}</span>
                    </div>
                    <div className="flex gap-[2px]">
                        {onMinimize && (
                            <button
                                onClick={onMinimize}
                                className="w-4 h-[14px] bg-[#c0c0c0] border border-[#ffffff] border-r-[#808080] border-b-[#808080] flex items-center justify-center text-[9px] font-bold active:border-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] active:translate-x-[1px] active:translate-y-[1px]"
                            >
                                _
                            </button>
                        )}
                        {onMaximize && (
                            <button
                                onClick={onMaximize}
                                className="w-4 h-[14px] bg-[#c0c0c0] border border-[#ffffff] border-r-[#808080] border-b-[#808080] flex items-center justify-center text-[9px] font-bold active:border-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] active:translate-x-[1px] active:translate-y-[1px]"
                            >
                                □
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-4 h-[14px] bg-[#c0c0c0] border border-[#ffffff] border-r-[#808080] border-b-[#808080] flex items-center justify-center text-[9px] font-bold active:border-[#808080] active:border-r-[#ffffff] active:border-b-[#ffffff] active:translate-x-[1px] active:translate-y-[1px] ml-[2px]"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-[#c0c0c0]">
                    {children}
                </div>
            </div>
        );
    }
);
Win95Window.displayName = 'Win95Window';
