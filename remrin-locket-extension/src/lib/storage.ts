/**
 * Chrome storage wrapper
 */

import type { ExtensionState, Soul, SessionState } from '../types'

const DEFAULT_STATE: ExtensionState = {
    isAuthenticated: false,
    userId: null,
    activeSoulId: null,
    souls: [],
    sessionState: {}
}

/**
 * Get extension state from chrome.storage
 */
export async function getState(): Promise<ExtensionState> {
    const result = await chrome.storage.local.get('remrinState')
    return result.remrinState || DEFAULT_STATE
}

/**
 * Update extension state
 */
export async function setState(updates: Partial<ExtensionState>): Promise<void> {
    const current = await getState()
    await chrome.storage.local.set({
        remrinState: { ...current, ...updates }
    })
}

/**
 * Get active soul
 */
export async function getActiveSoul(): Promise<Soul | null> {
    const state = await getState()
    if (!state.activeSoulId) return null
    return state.souls.find(s => s.id === state.activeSoulId) || null
}

/**
 * Set active soul
 */
export async function setActiveSoul(soulId: string | null): Promise<void> {
    await setState({ activeSoulId: soulId })
}

/**
 * Update souls list
 */
export async function setSouls(souls: Soul[]): Promise<void> {
    await setState({ souls })
}

/**
 * Get session state for a tab
 */
export async function getTabSession(tabId: number): Promise<SessionState | null> {
    const state = await getState()
    return state.sessionState[tabId.toString()] || null
}

/**
 * Update session state for a tab
 */
export async function setTabSession(tabId: number, session: Partial<SessionState>): Promise<void> {
    const state = await getState()
    const current = state.sessionState[tabId.toString()] || {
        tabId,
        url: '',
        injected: false,
        soulId: null,
        messageCount: 0
    }

    await setState({
        sessionState: {
            ...state.sessionState,
            [tabId.toString()]: { ...current, ...session }
        }
    })
}

/**
 * Clear session state for a tab
 */
export async function clearTabSession(tabId: number): Promise<void> {
    const state = await getState()
    const newSessionState = { ...state.sessionState }
    delete newSessionState[tabId.toString()]
    await setState({ sessionState: newSessionState })
}

/**
 * Clear all state (logout)
 */
export async function clearState(): Promise<void> {
    await chrome.storage.local.set({ remrinState: DEFAULT_STATE })
}
