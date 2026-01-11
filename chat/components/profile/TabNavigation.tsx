'use client';

import { useState } from 'react';
import { LucideIcon, Home, Briefcase, User, BarChart3, Award } from 'lucide-react';

/**
 * Tab configuration
 */
export interface Tab {
    id: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
}

/**
 * Props for the TabNavigation component
 */
interface TabNavigationProps {
    /** Array of tabs to display */
    tabs?: Tab[];
    /** Currently active tab ID */
    activeTab?: string;
    /** Callback when tab changes */
    onTabChange?: (tabId: string) => void;
}

const defaultTabs: Tab[] = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'work', label: 'Work', icon: Briefcase },
    { id: 'about', label: 'About', icon: User },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'achievements', label: 'Achievements', icon: Award },
];

/**
 * TabNavigation - Horizontal tab navigation with icons and smooth transitions
 * 
 * @example
 * ```tsx
 * <TabNavigation 
 *   tabs={customTabs}
 *   activeTab="feed"
 *   onTabChange={(id) => console.log(id)}
 * />
 * ```
 */
export function TabNavigation({
    tabs = defaultTabs,
    activeTab: controlledActiveTab,
    onTabChange,
}: TabNavigationProps) {
    const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.id || '');
    const activeTab = controlledActiveTab ?? internalActiveTab;

    const handleTabClick = (tabId: string) => {
        setInternalActiveTab(tabId);
        onTabChange?.(tabId);
    };

    return (
        <nav
            className="border-b border-rp-highlight-med bg-rp-surface/50 backdrop-blur-sm sticky top-0 z-10"
            role="tablist"
            aria-label="Profile navigation"
        >
            <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`panel-${tab.id}`}
                            onClick={() => handleTabClick(tab.id)}
                            className={`
                                flex items-center gap-2 px-6 py-4 
                                font-medium text-sm whitespace-nowrap
                                transition-all duration-300
                                border-b-2 
                                ${isActive
                                    ? 'border-rp-iris text-rp-iris'
                                    : 'border-transparent text-rp-subtle hover:text-rp-text hover:border-rp-muted'
                                }
                                focus:outline-none focus:ring-2 focus:ring-rp-iris focus:ring-offset-2 focus:ring-offset-rp-base
                            `}
                        >
                            <Icon
                                className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : ''
                                    }`}
                                aria-hidden="true"
                            />
                            <span>{tab.label}</span>
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span
                                    className="
                                        ml-1 px-2 py-0.5 
                                        bg-rp-love text-white 
                                        text-xs font-bold rounded-full
                                        min-w-[1.25rem] text-center
                                    "
                                    aria-label={`${tab.badge} new items`}
                                >
                                    {tab.badge > 99 ? '99+' : tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
