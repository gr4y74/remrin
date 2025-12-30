/**
 * Content Script Entry Point
 * Runs on Claude, ChatGPT, and Gemini pages
 */

import { getSiteConfig, findInputElement, findSubmitButton, getInputText, setInputText } from './sites/selectors'
import { LocketInjector } from './injector'
import { InputInterceptor } from './interceptor'
import type { Soul, ExtensionMessage, ExtensionResponse } from '../types'

console.log('🔮 Remrin Locket: Content script loaded')

// Initialize components
const injector = new LocketInjector()
const interceptor = new InputInterceptor()

let activeSoul: Soul | null = null
let isProcessing = false

/**
 * Send message to background worker
 */
async function sendMessage<T>(message: ExtensionMessage): Promise<ExtensionResponse<T>> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, resolve)
    })
}

/**
 * Handle soul selection from UI
 */
async function onSoulSelect(soulId: string | null): Promise<void> {
    await sendMessage({ type: 'SET_ACTIVE_SOUL', payload: soulId })

    if (soulId) {
        const state = await sendMessage<{ souls: Soul[] }>({ type: 'GET_STATE' })
        if (state.success && state.data) {
            activeSoul = state.data.souls.find(s => s.id === soulId) || null
        }
    } else {
        activeSoul = null
    }

    // Reset interceptor when soul changes
    interceptor.reset()
}

/**
 * Intercept form submission
 */
async function interceptSubmit(e: Event): Promise<void> {
    if (!activeSoul || isProcessing) return

    const inputElement = findInputElement()
    if (!inputElement) return

    const userText = getInputText(inputElement)
    if (!userText.trim()) return

    // Prevent default submission
    e.preventDefault()
    e.stopPropagation()

    isProcessing = true
    injector.setThinking(true)

    try {
        // Get RAG context
        const ragResponse = await sendMessage<string>({
            type: 'GET_RAG_CONTEXT',
            payload: { query: userText, personaId: activeSoul.id }
        })
        const ragContext = ragResponse.success ? (ragResponse.data || '') : ''

        // Wrap input with persona context
        const wrappedText = await interceptor.wrapInput(inputElement, activeSoul, ragContext)

        // Set the wrapped text
        setInputText(inputElement, wrappedText)

        // Small delay to let the site's React update
        await new Promise(r => setTimeout(r, 50))

        // Click the submit button
        const submitBtn = findSubmitButton()
        if (submitBtn) {
            submitBtn.click()
        }
    } catch (error) {
        console.error('[Locket] Intercept error:', error)
        // On error, restore original text and let user retry
    } finally {
        isProcessing = false
        injector.setThinking(false)
    }
}

/**
 * Set up keyboard interception
 */
function setupKeyboardIntercept(): void {
    document.addEventListener('keydown', async (e) => {
        // Only intercept Enter without Shift (Shift+Enter is usually newline)
        if (e.key === 'Enter' && !e.shiftKey && activeSoul) {
            const inputElement = findInputElement()
            if (inputElement && document.activeElement === inputElement) {
                await interceptSubmit(e)
            }
        }
    }, true) // Use capture phase
}

/**
 * Set up submit button interception
 */
function setupSubmitIntercept(): void {
    // Use MutationObserver to catch dynamically added buttons
    const observer = new MutationObserver(() => {
        const submitBtn = findSubmitButton()
        if (submitBtn && !submitBtn.hasAttribute('data-locket-hooked')) {
            submitBtn.setAttribute('data-locket-hooked', 'true')
            submitBtn.addEventListener('click', interceptSubmit, true)
        }
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

/**
 * Initialize the extension on this page
 */
async function init(): Promise<void> {
    const config = getSiteConfig()
    if (!config) {
        console.log('[Locket] Not on a supported site, skipping')
        return
    }

    console.log(`🔮 [Locket] Initializing on ${config.name}`)

    // Inject Locket UI
    injector.inject(onSoulSelect)

    // Set up interception
    setupKeyboardIntercept()
    setupSubmitIntercept()

    // Fetch initial state
    const stateResponse = await sendMessage<{
        souls: Soul[]
        activeSoulId: string | null
        isAuthenticated: boolean
    }>({ type: 'GET_STATE' })

    if (stateResponse.success && stateResponse.data?.isAuthenticated) {
        // Fetch souls
        const soulsResponse = await sendMessage<Soul[]>({ type: 'GET_SOULS' })

        if (soulsResponse.success && soulsResponse.data) {
            injector.updateSouls(soulsResponse.data, stateResponse.data.activeSoulId)

            // Set active soul if one was previously selected
            if (stateResponse.data.activeSoulId) {
                activeSoul = soulsResponse.data.find(s => s.id === stateResponse.data!.activeSoulId) || null
            }
        }
    } else {
        // Not authenticated - show login prompt in menu
        injector.updateSouls([], null)
    }
}

// Wait for page to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}

// Handle navigation (for SPAs like Claude)
let lastUrl = window.location.href
new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href
        interceptor.reset()
    }
}).observe(document.body, { childList: true, subtree: true })
