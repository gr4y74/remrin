/**
 * Site-specific selectors for LLM platforms
 */

import type { SiteConfig } from '../types'

export const SITE_CONFIGS: Record<string, SiteConfig> = {
    'claude.ai': {
        name: 'Claude',
        hostname: 'claude.ai',
        inputSelector: 'div[contenteditable="true"][data-placeholder]',
        submitSelector: 'button[aria-label="Send Message"], button[aria-label="Send message"]',
        messageContainerSelector: '.prose',
        injectPosition: 'before'
    },
    'chatgpt.com': {
        name: 'ChatGPT',
        hostname: 'chatgpt.com',
        inputSelector: '#prompt-textarea',
        submitSelector: 'button[data-testid="send-button"]',
        messageContainerSelector: '.markdown',
        injectPosition: 'inside'
    },
    'chat.openai.com': {
        name: 'ChatGPT',
        hostname: 'chat.openai.com',
        inputSelector: '#prompt-textarea',
        submitSelector: 'button[data-testid="send-button"]',
        messageContainerSelector: '.markdown',
        injectPosition: 'inside'
    },
    'gemini.google.com': {
        name: 'Gemini',
        hostname: 'gemini.google.com',
        inputSelector: 'div[role="textbox"][contenteditable="true"], rich-textarea',
        submitSelector: 'button[aria-label="Send message"], button.send-button',
        messageContainerSelector: '.response-content, .model-response',
        injectPosition: 'before'
    }
}

/**
 * Get site config for current hostname
 */
export function getSiteConfig(): SiteConfig | null {
    const hostname = window.location.hostname
    return SITE_CONFIGS[hostname] || null
}

/**
 * Find the input element on the current page
 */
export function findInputElement(): HTMLElement | null {
    const config = getSiteConfig()
    if (!config) return null

    // Try each selector (some sites have multiple possible selectors)
    const selectors = config.inputSelector.split(', ')
    for (const selector of selectors) {
        const element = document.querySelector<HTMLElement>(selector)
        if (element) return element
    }

    return null
}

/**
 * Find the submit button on the current page
 */
export function findSubmitButton(): HTMLButtonElement | null {
    const config = getSiteConfig()
    if (!config) return null

    const selectors = config.submitSelector.split(', ')
    for (const selector of selectors) {
        const element = document.querySelector<HTMLButtonElement>(selector)
        if (element) return element
    }

    return null
}

/**
 * Get text content from input element (handles contenteditable)
 */
export function getInputText(element: HTMLElement): string {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        return (element as HTMLInputElement | HTMLTextAreaElement).value
    }
    // ContentEditable div
    return element.innerText || element.textContent || ''
}

/**
 * Set text content in input element (handles contenteditable)
 */
export function setInputText(element: HTMLElement, text: string): void {
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const input = element as HTMLInputElement | HTMLTextAreaElement
        input.value = text
        // Trigger input event for React-based sites
        input.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
        // ContentEditable div
        element.innerText = text
        element.dispatchEvent(new Event('input', { bubbles: true }))
    }
}

/**
 * Check if currently in a new chat (no messages yet)
 */
export function isNewChat(): boolean {
    const url = window.location.href
    const hostname = window.location.hostname

    if (hostname === 'claude.ai') {
        return url.includes('/new') || !url.includes('/chat/')
    }
    if (hostname.includes('chatgpt')) {
        return !url.includes('/c/')
    }
    if (hostname === 'gemini.google.com') {
        return !url.includes('/c/')
    }

    return true
}
