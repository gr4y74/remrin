/**
 * SUPABASE TOKEN RECOVERY UTILITY
 * 
 * Scrapes localStorage for Supabase auth tokens as a last-resort fallback.
 * Useful when multiple client instances cause session synchronization issues.
 */

export function getRecoveredToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        // 1. Look for standard Supabase auth token keys
        const keys = Object.keys(localStorage);
        const tokenKey = keys.find(k => k.endsWith('-auth-token'));

        if (!tokenKey) {
            console.warn('🕵️ [TokenRecovery] No auth-token key found in localStorage');
            return null;
        }

        const rawData = localStorage.getItem(tokenKey);
        if (!rawData) return null;

        const data = JSON.parse(rawData);
        const token = data.access_token || null;

        if (token) {
            console.log('✅ [TokenRecovery] Successfully recovered token from localStorage.');
        } else {
            console.warn('🕵️ [TokenRecovery] Token key found but access_token is missing.');
        }

        return token;
    } catch (error) {
        console.error('❌ [TokenRecovery] Error during token recovery:', error);
        return null;
    }
}
