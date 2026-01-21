import React from 'react';
import { cn } from '@/lib/utils';
import '@/components/aol-chat/styles/xp-theme.css';

interface XPWindowProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    icon?: string;
    onClose?: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    isActive?: boolean;
}

export const XPWindow = React.forwardRef<HTMLDivElement, XPWindowProps>(
    ({ className, title, icon, children, onClose, onMinimize, onMaximize, isActive = true, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "bg-[var(--xp-window-bg)] rounded-t-lg rounded-b-md shadow-xl flex flex-col overflow-hidden border border-[var(--xp-window-border)] relative",
                    "before:absolute before:inset-0 before:rounded-lg before:border-[3px] before:border-[rgba(255,255,255,0.3)] before:pointer-events-none",
                    className
                )}
                {...props}
            >
                {/* Title Bar */}
                <div
                    className={cn(
                        "flex justify-between items-center px-2 py-1 select-none h-8",
                        isActive
                            ? "bg-[image:var(--xp-titlebar-active)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                            : "bg-[image:var(--xp-titlebar-inactive)] text-white/80"
                    )}
                >
                    <div className="flex items-center gap-2 font-bold text-[13px] text-shadow-sm shadow-black/20">
                        {icon && <img src={icon} alt="" className="w-4 h-4 drop-shadow-sm" />}
                        <span className="tracking-wide" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>{title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {onMinimize && (
                            <button
                                onClick={onMinimize}
                                className="w-[21px] h-[21px] rounded-[3px] bg-white/20 hover:bg-white/40 active:bg-white/10 flex items-center justify-center border border-white/40 shadow-sm transition-colors group"
                                aria-label="Minimize"
                            >
                                <div className="w-2 h-0.5 bg-white shadow-[0_1px_0_rgba(0,0,0,0.3)]" />
                            </button>
                        )}
                        {onMaximize && (
                            <button
                                onClick={onMaximize}
                                className="w-[21px] h-[21px] rounded-[3px] bg-white/20 hover:bg-white/40 active:bg-white/10 flex items-center justify-center border border-white/40 shadow-sm transition-colors group"
                                aria-label="Maximize"
                            >
                                <div className="w-2.5 h-2 border-[1.5px] border-white shadow-[0_1px_0_rgba(0,0,0,0.3)]" />
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-[21px] h-[21px] rounded-[3px] bg-[#d73f28] hover:bg-[#e85e49] active:bg-[#b02b18] flex items-center justify-center border border-white/40 shadow-sm transition-colors ml-0.5"
                                aria-label="Close"
                            >
                                <span className="text-white text-[14px] font-bold leading-none shadow-[0_1px_0_rgba(0,0,0,0.3)] relative top-[-1px]">×</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-[var(--xp-window-bg)] flex-1 relative">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#0054e3]/20 to-transparent" />
                    {children}
                </div>
            </div>
        );
    }
);
XPWindow.displayName = 'XPWindow';
