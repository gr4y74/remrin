'use client';

import { useState, ReactNode } from 'react';
import { Edit2, Save } from 'lucide-react';

/**
 * Props for the EnhancedProfileLayout component
 */
interface EnhancedProfileLayoutProps {
    /** Left sidebar content (personal details) */
    sidebar: ReactNode;
    /** Main content area (tabs, feed, etc.) */
    mainContent: ReactNode;
    /** Right panel content (highlights, activity) */
    rightPanel?: ReactNode;
    /** Whether this is the user's own profile */
    isOwnProfile?: boolean;
    /** Callback when edit mode changes */
    onEditModeChange?: (isEditMode: boolean) => void;
    /** Whether to show the right panel on mobile */
    showRightPanelOnMobile?: boolean;
}

/**
 * EnhancedProfileLayout - 3-column responsive grid layout for profile pages
 * 
 * Features:
 * - Responsive 3-column layout (desktop) → stacked (mobile)
 * - Edit mode toggle for profile owners
 * - Sticky sidebar on desktop
 * - Flexible content areas
 * 
 * @example
 * ```tsx
 * <EnhancedProfileLayout
 *   sidebar={<PersonalDetailsPanel {...} />}
 *   mainContent={<TabNavigation {...} />}
 *   rightPanel={<HighlightsSection {...} />}
 *   isOwnProfile={true}
 *   onEditModeChange={(mode) => {}}
 * />
 * ```
 */
export function EnhancedProfileLayout({
    sidebar,
    mainContent,
    rightPanel,
    isOwnProfile = false,
    onEditModeChange,
    showRightPanelOnMobile = false,
}: EnhancedProfileLayoutProps) {
    const [isEditMode, setIsEditMode] = useState(false);

    const handleEditModeToggle = () => {
        const newMode = !isEditMode;
        setIsEditMode(newMode);
        onEditModeChange?.(newMode);
    };

    return (
        <div className="min-h-screen bg-rp-base">
            {/* Edit Mode Toggle (Fixed) */}
            {isOwnProfile && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={handleEditModeToggle}
                        className={`
                            flex items-center gap-3 px-6 py-3 rounded-full
                            font-semibold shadow-2xl
                            transition-all duration-300
                            hover:scale-105
                            focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-rp-base
                            ${isEditMode
                                ? 'bg-rp-foam text-rp-base focus:ring-rp-foam'
                                : 'bg-rp-iris text-white focus:ring-rp-iris'
                            }
                        `}
                        aria-label={isEditMode ? 'Save changes' : 'Edit profile'}
                    >
                        {isEditMode ? (
                            <>
                                <Save className="w-5 h-5" aria-hidden="true" />
                                <span>Save Changes</span>
                            </>
                        ) : (
                            <>
                                <Edit2 className="w-5 h-5" aria-hidden="true" />
                                <span>Edit Profile</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Main Layout Container */}
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar - Personal Details */}
                    <aside
                        className="lg:col-span-3 space-y-6"
                        role="complementary"
                        aria-label="Personal details"
                    >
                        <div className="lg:sticky lg:top-6">
                            {sidebar}
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main
                        className={`
                            ${rightPanel ? 'lg:col-span-6' : 'lg:col-span-9'}
                            space-y-6
                        `}
                        role="main"
                    >
                        {mainContent}
                    </main>

                    {/* Right Panel - Highlights/Activity */}
                    {rightPanel && (
                        <aside
                            className={`
                                lg:col-span-3 space-y-6
                                ${showRightPanelOnMobile ? '' : 'hidden lg:block'}
                            `}
                            role="complementary"
                            aria-label="Highlights and activity"
                        >
                            <div className="lg:sticky lg:top-6">
                                {rightPanel}
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {/* Edit Mode Overlay Indicator */}
            {isEditMode && (
                <div
                    className="fixed top-0 left-0 right-0 bg-rp-iris/10 backdrop-blur-sm border-b-2 border-rp-iris py-3 px-6 z-40"
                    role="alert"
                    aria-live="polite"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-rp-iris rounded-full animate-pulse" aria-hidden="true" />
                            <span className="text-sm font-medium text-rp-text">
                                Edit Mode Active - Make your changes and click Save
                            </span>
                        </div>
                        <button
                            onClick={handleEditModeToggle}
                            className="text-sm text-rp-subtle hover:text-rp-text transition-colors underline"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
