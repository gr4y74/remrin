'use client';

/**
 * QuotaIndicator Component
 * 
 * A subtle, non-intrusive UI component showing audio quota usage.
 * Features:
 * - Progress bar with color-coded status
 * - Percentage used display
 * - Reset countdown timer
 * - Upgrade prompt when near limit
 * - Smooth animations
 * 
 * Color coding:
 * - Green: <50% used
 * - Yellow: 50-80% used
 * - Orange: 80-95% used
 * - Red: >95% or exceeded
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, TrendingUp, Clock, AlertTriangle, Sparkles, ChevronsUp } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface QuotaData {
    tier: string;
    tierName: string;
    tierDescription: string;
    used: number;
    limit: number;
    remaining: number;
    percentUsed: number;
    unlimited: boolean;
    exceeded: boolean;
    inGracePeriod: boolean;
    graceRemaining: number;
    resetDate: string;
    resetIn: {
        hours: number;
        minutes: number;
        formatted: string;
    };
    providers: string[];
    canUpgrade: boolean;
    upgradeUrl: string | null;
    upgradeMessage: string | null;
}

interface QuotaIndicatorProps {
    /** Show compact version */
    compact?: boolean;
    /** Show upgrade prompt */
    showUpgrade?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Refresh interval in milliseconds (default: 60000 = 1 min) */
    refreshInterval?: number;
    /** Callback when quota is low */
    onQuotaLow?: (percentUsed: number) => void;
    /** Callback when quota is exceeded */
    onQuotaExceeded?: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusColor(percentUsed: number, exceeded: boolean): string {
    if (exceeded) return 'var(--rose-love)';
    if (percentUsed >= 95) return 'var(--rose-love)';
    if (percentUsed >= 80) return 'var(--rose-gold)';
    if (percentUsed >= 50) return 'var(--rose-gold)';
    return 'var(--rose-pine)';
}

function getStatusClass(percentUsed: number, exceeded: boolean): string {
    if (exceeded) return 'status-critical';
    if (percentUsed >= 95) return 'status-critical';
    if (percentUsed >= 80) return 'status-warning';
    if (percentUsed >= 50) return 'status-caution';
    return 'status-good';
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return String(num);
}

// ============================================================================
// Component
// ============================================================================

export function QuotaIndicator({
    compact = false,
    showUpgrade = true,
    className = '',
    refreshInterval = 60000,
    onQuotaLow,
    onQuotaExceeded,
}: QuotaIndicatorProps) {
    const [quota, setQuota] = useState<QuotaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [animateBar, setAnimateBar] = useState(false);

    // Fetch quota data
    const fetchQuota = async () => {
        try {
            const response = await fetch('/api/audio/quota');

            if (!response.ok) {
                if (response.status === 401) {
                    setQuota(null);
                    return;
                }
                throw new Error('Failed to fetch quota');
            }

            const data = await response.json();

            if (data.success && data.quota) {
                setQuota(data.quota);
                setError(null);

                // Trigger callbacks
                if (data.quota.exceeded && onQuotaExceeded) {
                    onQuotaExceeded();
                } else if (data.quota.percentUsed >= 80 && onQuotaLow) {
                    onQuotaLow(data.quota.percentUsed);
                }

                // Animate progress bar
                setAnimateBar(false);
                setTimeout(() => setAnimateBar(true), 50);
            }
        } catch (err) {
            console.error('[QuotaIndicator] Error:', err);
            setError('Failed to load quota');
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch and interval
    useEffect(() => {
        fetchQuota();

        const interval = setInterval(fetchQuota, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval]);

    // Loading state
    if (loading) {
        return (
            <div className={`quota-indicator quota-loading ${className}`}>
                <div className="quota-skeleton">
                    <div className="skeleton-bar" />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`quota-indicator quota-error ${className}`}>
                <AlertTriangle size={14} />
                <span>{error}</span>
            </div>
        );
    }

    // Not authenticated or no quota
    if (!quota) {
        return null;
    }

    // VIP/Unlimited users get a simpler display
    if (quota.unlimited) {
        return (
            <div className={`quota-indicator quota-unlimited ${className}`}>
                <Sparkles size={14} className="quota-icon" />
                <span className="quota-label">Unlimited</span>
                <span className="quota-tier">{quota.tierName}</span>
            </div>
        );
    }

    const statusClass = getStatusClass(quota.percentUsed, quota.exceeded);
    const statusColor = getStatusColor(quota.percentUsed, quota.exceeded);

    // Compact version
    if (compact) {
        return (
            <div
                className={`quota-indicator quota-compact ${statusClass} ${className}`}
                title={`${formatNumber(quota.used)} / ${formatNumber(quota.limit)} characters used`}
            >
                <Zap size={12} className="quota-icon" />
                <span className="quota-percent">{quota.percentUsed}%</span>
                <div
                    className="quota-mini-bar"
                    style={{
                        '--progress': `${quota.percentUsed}%`,
                        '--status-color': statusColor,
                    } as React.CSSProperties}
                >
                    <div className={`mini-bar-fill ${animateBar ? 'animate' : ''}`} />
                </div>
            </div>
        );
    }

    // Full version
    return (
        <div className={`quota-indicator ${statusClass} ${className}`}>
            {/* Header */}
            <div className="quota-header">
                <div className="quota-title">
                    <Zap size={16} className="quota-icon" />
                    <span>Audio Quota</span>
                    <span className="quota-tier-badge">{quota.tierName}</span>
                </div>
                <div className="quota-stats">
                    <span className="quota-used">{formatNumber(quota.used)}</span>
                    <span className="quota-separator">/</span>
                    <span className="quota-limit">{formatNumber(quota.limit)}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="quota-progress-container">
                <div
                    className="quota-progress-bar"
                    style={{
                        '--progress': `${Math.min(quota.percentUsed, 100)}%`,
                        '--status-color': statusColor,
                    } as React.CSSProperties}
                >
                    <div className={`progress-fill ${animateBar ? 'animate' : ''}`} />
                    {quota.inGracePeriod && (
                        <div
                            className="grace-indicator"
                            style={{ left: '100%' }}
                        />
                    )}
                </div>
                <span className="quota-percent-label">{quota.percentUsed}%</span>
            </div>

            {/* Status Messages */}
            {quota.exceeded && (
                <div className="quota-exceeded-warning">
                    <AlertTriangle size={14} />
                    <span>
                        {quota.inGracePeriod
                            ? `Grace period: ${formatNumber(quota.graceRemaining)} chars remaining`
                            : 'Daily limit exceeded'}
                    </span>
                </div>
            )}

            {/* Footer */}
            <div className="quota-footer">
                <div className="quota-reset">
                    <Clock size={12} />
                    <span>Resets in {quota.resetIn.formatted}</span>
                </div>

                {showUpgrade && quota.canUpgrade && quota.percentUsed >= 50 && (
                    <Link href={quota.upgradeUrl || '/pricing'} className="quota-upgrade-link">
                        <ChevronsUp size={12} />
                        <span>Upgrade</span>
                    </Link>
                )}
            </div>

            {/* Upgrade CTA for exceeded users */}
            {showUpgrade && quota.exceeded && quota.canUpgrade && (
                <Link
                    href={quota.upgradeUrl || '/pricing'}
                    className="quota-upgrade-cta"
                >
                    <TrendingUp size={16} />
                    <span>{quota.upgradeMessage || 'Upgrade for more'}</span>
                </Link>
            )}

            <style jsx>{`
                .quota-indicator {
                    --rose-pine: #31748f;
                    --rose-gold: #f6c177;
                    --rose-love: #eb6f92;
                    --rose-subtle: rgba(49, 116, 143, 0.1);
                    --rose-surface: #1f1d2e;
                    --rose-overlay: #26233a;
                    --rose-text: #e0def4;
                    --rose-muted: #908caa;
                    
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding: 12px 14px;
                    background: var(--rose-overlay);
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    font-size: 13px;
                    color: var(--rose-text);
                    transition: all 0.2s ease;
                }

                .quota-indicator:hover {
                    border-color: rgba(255, 255, 255, 0.1);
                }

                /* Status variants */
                .status-good {
                    --status-color: var(--rose-pine);
                }
                .status-caution {
                    --status-color: var(--rose-gold);
                }
                .status-warning {
                    --status-color: var(--rose-gold);
                }
                .status-critical {
                    --status-color: var(--rose-love);
                    border-color: rgba(235, 111, 146, 0.2);
                }

                /* Header */
                .quota-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .quota-title {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 500;
                }

                .quota-icon {
                    color: var(--status-color);
                }

                .quota-tier-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    color: var(--rose-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .quota-stats {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    font-family: 'SF Mono', 'Consolas', monospace;
                    font-size: 12px;
                }

                .quota-used {
                    color: var(--status-color);
                    font-weight: 600;
                }

                .quota-separator {
                    color: var(--rose-muted);
                }

                .quota-limit {
                    color: var(--rose-muted);
                }

                /* Progress Bar */
                .quota-progress-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .quota-progress-bar {
                    flex: 1;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-fill {
                    height: 100%;
                    width: 0;
                    background: var(--status-color);
                    border-radius: 3px;
                    transition: width 0.6s ease-out;
                }

                .progress-fill.animate {
                    width: var(--progress);
                }

                .grace-indicator {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: var(--rose-love);
                    opacity: 0.7;
                }

                .quota-percent-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--status-color);
                    min-width: 32px;
                    text-align: right;
                }

                /* Exceeded Warning */
                .quota-exceeded-warning {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    background: rgba(235, 111, 146, 0.1);
                    border-radius: 6px;
                    color: var(--rose-love);
                    font-size: 12px;
                }

                /* Footer */
                .quota-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 2px;
                }

                .quota-reset {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    color: var(--rose-muted);
                }

                .quota-upgrade-link {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    color: var(--rose-pine);
                    text-decoration: none;
                    transition: color 0.15s;
                }

                .quota-upgrade-link:hover {
                    color: var(--rose-text);
                }

                /* Upgrade CTA */
                .quota-upgrade-cta {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 10px;
                    background: linear-gradient(135deg, var(--rose-pine), #3e8a9e);
                    border-radius: 8px;
                    color: white;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 12px;
                    transition: all 0.2s;
                }

                .quota-upgrade-cta:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(49, 116, 143, 0.3);
                }

                /* Compact Version */
                .quota-compact {
                    flex-direction: row;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 10px;
                    background: transparent;
                    border: none;
                }

                .quota-compact .quota-percent {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--status-color);
                }

                .quota-mini-bar {
                    width: 40px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }

                .mini-bar-fill {
                    height: 100%;
                    width: 0;
                    background: var(--status-color);
                    border-radius: 2px;
                    transition: width 0.4s ease-out;
                }

                .mini-bar-fill.animate {
                    width: var(--progress);
                }

                /* Unlimited Version */
                .quota-unlimited {
                    flex-direction: row;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 10px;
                    background: linear-gradient(135deg, rgba(49, 116, 143, 0.1), rgba(196, 167, 231, 0.1));
                    border: 1px solid rgba(196, 167, 231, 0.2);
                }

                .quota-unlimited .quota-icon {
                    color: #c4a7e7;
                }

                .quota-unlimited .quota-label {
                    color: #c4a7e7;
                    font-weight: 500;
                }

                .quota-unlimited .quota-tier {
                    font-size: 10px;
                    color: var(--rose-muted);
                    margin-left: auto;
                }

                /* Loading State */
                .quota-loading {
                    padding: 8px;
                }

                .quota-skeleton {
                    width: 100%;
                }

                .skeleton-bar {
                    height: 6px;
                    background: linear-gradient(90deg, 
                        rgba(255,255,255,0.03) 0%, 
                        rgba(255,255,255,0.08) 50%, 
                        rgba(255,255,255,0.03) 100%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 3px;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Error State */
                .quota-error {
                    flex-direction: row;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    color: var(--rose-love);
                    font-size: 12px;
                }
            `}</style>
        </div>
    );
}

export default QuotaIndicator;
