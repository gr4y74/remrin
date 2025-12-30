/**
 * Shadow DOM Injector
 * Injects the Locket UI button into target LLM sites
 */

import type { Soul } from '../types'
import { getSiteConfig, findInputElement } from './sites/selectors'

const LOCKET_STYLES = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .locket-container {
    position: fixed;
    bottom: 100px;
    right: 24px;
    z-index: 2147483647;
  }
  
  .locket-button {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: none;
    outline: none;
  }
  
  .locket-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(139, 92, 246, 0.6);
  }
  
  .locket-button.active {
    box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.5), 0 6px 30px rgba(139, 92, 246, 0.6);
  }
  
  .locket-icon {
    width: 32px;
    height: 32px;
  }
  
  .locket-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  .locket-menu {
    position: absolute;
    bottom: 64px;
    right: 0;
    width: 280px;
    max-height: 400px;
    overflow-y: auto;
    background: #1a1a2e;
    border-radius: 16px;
    border: 1px solid rgba(139, 92, 246, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px);
    transition: all 0.2s ease;
  }
  
  .locket-menu.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .locket-header {
    padding: 16px;
    border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  }
  
  .locket-title {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    margin: 0 0 4px 0;
  }
  
  .locket-subtitle {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }
  
  .locket-souls {
    padding: 8px;
  }
  
  .soul-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .soul-item:hover {
    background: rgba(139, 92, 246, 0.15);
  }
  
  .soul-item.active {
    background: rgba(139, 92, 246, 0.25);
  }
  
  .soul-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  .soul-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .soul-info {
    flex: 1;
    min-width: 0;
  }
  
  .soul-name {
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .soul-status {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    margin: 2px 0 0 0;
  }
  
  .locket-footer {
    padding: 12px 16px;
    border-top: 1px solid rgba(139, 92, 246, 0.2);
  }
  
  .disable-btn {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #F87171;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  
  .disable-btn:hover {
    background: rgba(239, 68, 68, 0.3);
  }
  
  .locket-status {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #10B981;
    border: 2px solid #1a1a2e;
    display: none;
  }
  
  .locket-status.connected {
    display: block;
  }
  
  .thinking-indicator {
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

export class LocketInjector {
  private host: HTMLDivElement | null = null
  private shadow: ShadowRoot | null = null
  private menuOpen = false
  private souls: Soul[] = []
  private activeSoulId: string | null = null
  private onSoulSelect: ((soulId: string | null) => void) | null = null

  /**
   * Inject the Locket UI into the page
   */
  inject(onSoulSelect: (soulId: string | null) => void): void {
    if (this.host) return // Already injected

    const config = getSiteConfig()
    if (!config) {
      console.log('[Locket] Not on a supported site')
      return
    }

    this.onSoulSelect = onSoulSelect

    // Create shadow host
    this.host = document.createElement('div')
    this.host.id = 'remrin-locket-root'

    // Attach closed shadow DOM
    this.shadow = this.host.attachShadow({ mode: 'closed' })

    // Inject styles
    const style = document.createElement('style')
    style.textContent = LOCKET_STYLES
    this.shadow.appendChild(style)

    // Create container
    const container = document.createElement('div')
    container.className = 'locket-container'
    container.innerHTML = this.renderUI()
    this.shadow.appendChild(container)

    // Add to page
    document.body.appendChild(this.host)

    // Set up event listeners
    this.setupEventListeners()

    console.log('🔮 [Locket] UI injected on', config.name)
  }

  /**
   * Render the Locket UI HTML
   */
  private renderUI(): string {
    // Get icon URL with fallback
    let iconUrl = ''
    try {
      iconUrl = chrome.runtime.getURL('icons/locket-48.png')
    } catch (e) {
      console.warn('[Locket] Could not get icon URL:', e)
    }

    const iconContent = iconUrl
      ? `<img src="${iconUrl}" alt="Locket" />`
      : '🔮'

    return `
      <button class="locket-button" id="locket-toggle">
        <span class="locket-icon">${iconContent}</span>
        <span class="locket-status"></span>
      </button>
      
      <div class="locket-menu" id="locket-menu">
        <div class="locket-header">
          <p class="locket-title">Remrin Locket</p>
          <p class="locket-subtitle">Select a persona to activate</p>
        </div>
        <div class="locket-souls" id="soul-list">
          <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; padding: 20px;">
            Loading souls...
          </p>
        </div>
        <div class="locket-footer">
          <button class="disable-btn" id="disable-locket">
            Disable Locket
          </button>
        </div>
      </div>
    `
  }

  /**
   * Set up click handlers
   */
  private setupEventListeners(): void {
    if (!this.shadow) return

    const toggle = this.shadow.getElementById('locket-toggle')
    const menu = this.shadow.getElementById('locket-menu')
    const disableBtn = this.shadow.getElementById('disable-locket')

    toggle?.addEventListener('click', () => {
      this.menuOpen = !this.menuOpen
      menu?.classList.toggle('open', this.menuOpen)
      toggle.classList.toggle('active', this.menuOpen)
    })

    disableBtn?.addEventListener('click', () => {
      this.setActiveSoul(null)
      this.menuOpen = false
      menu?.classList.remove('open')
      toggle?.classList.remove('active')
    })

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (this.host && !this.host.contains(e.target as Node)) {
        this.menuOpen = false
        menu?.classList.remove('open')
        toggle?.classList.remove('active')
      }
    })
  }

  /**
   * Update souls list
   */
  updateSouls(souls: Soul[], activeSoulId: string | null): void {
    this.souls = souls
    this.activeSoulId = activeSoulId

    if (!this.shadow) return

    const list = this.shadow.getElementById('soul-list')
    const status = this.shadow.querySelector('.locket-status')

    if (!list) return

    if (souls.length === 0) {
      list.innerHTML = `
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; text-align: center; padding: 20px;">
          No souls found. Create one on Remrin.ai
        </p>
      `
      return
    }

    list.innerHTML = souls.map(soul => `
      <div class="soul-item ${soul.id === activeSoulId ? 'active' : ''}" data-soul-id="${soul.id}">
        <div class="soul-avatar">
          ${soul.avatar_url
        ? `<img src="${soul.avatar_url}" alt="${soul.name}" />`
        : soul.name.charAt(0).toUpperCase()
      }
        </div>
        <div class="soul-info">
          <p class="soul-name">${soul.name}</p>
          <p class="soul-status">${soul.id === activeSoulId ? '✓ Active' : 'Click to activate'}</p>
        </div>
      </div>
    `).join('')

    // Update status indicator
    if (status) {
      status.classList.toggle('connected', !!activeSoulId)
    }

    // Add click handlers
    list.querySelectorAll('.soul-item').forEach(item => {
      item.addEventListener('click', () => {
        const soulId = item.getAttribute('data-soul-id')
        if (soulId) this.setActiveSoul(soulId)
      })
    })
  }

  /**
   * Set active soul and notify callback
   */
  private setActiveSoul(soulId: string | null): void {
    this.activeSoulId = soulId
    this.updateSouls(this.souls, soulId)
    this.onSoulSelect?.(soulId)
  }

  /**
   * Show thinking indicator
   */
  setThinking(thinking: boolean): void {
    const icon = this.shadow?.querySelector('.locket-icon')
    icon?.classList.toggle('thinking-indicator', thinking)
  }

  /**
   * Remove the Locket UI
   */
  remove(): void {
    this.host?.remove()
    this.host = null
    this.shadow = null
  }
}
