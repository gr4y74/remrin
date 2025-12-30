/**
 * Popup Script
 */

import { getSupabase, signIn, signOut, isAuthenticated, getSession } from '../lib/supabase'
import { getState, setState } from '../lib/storage'
import type { Soul } from '../types'

// DOM Elements
const loginSection = document.getElementById('login-section') as HTMLDivElement
const mainSection = document.getElementById('main-section') as HTMLDivElement
const emailInput = document.getElementById('email') as HTMLInputElement
const passwordInput = document.getElementById('password') as HTMLInputElement
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement
const errorMsg = document.getElementById('error-msg') as HTMLParagraphElement
const soulsList = document.getElementById('souls-list') as HTMLDivElement
const userName = document.getElementById('user-name') as HTMLSpanElement

/**
 * Show login section
 */
function showLogin(): void {
    loginSection.style.display = 'block'
    mainSection.style.display = 'none'
    errorMsg.textContent = ''
}

/**
 * Show main section
 */
function showMain(email: string): void {
    loginSection.style.display = 'none'
    mainSection.style.display = 'block'
    userName.textContent = email
}

/**
 * Fetch and display souls
 */
async function loadSouls(): Promise<void> {
    const state = await getState()
    const activeSoulId = state.activeSoulId

    const session = await getSession()
    if (!session) return

    const supabase = getSupabase()
    const { data: personas } = await supabase
        .from('personas')
        .select('id, name, image_path')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10)

    if (!personas || personas.length === 0) {
        soulsList.innerHTML = `
      <p style="color: rgba(255,255,255,0.5); text-align: center; padding: 20px;">
        No souls found.<br/>
        <a href="https://remrin.ai/studio" target="_blank" style="color: #8B5CF6;">Create one →</a>
      </p>
    `
        return
    }

    soulsList.innerHTML = personas.map(p => `
    <div class="soul-item ${p.id === activeSoulId ? 'active' : ''}" data-id="${p.id}">
      <div class="soul-avatar">
        ${p.image_path
            ? `<img src="${p.image_path}" alt="${p.name}" />`
            : p.name.charAt(0).toUpperCase()
        }
      </div>
      <div class="soul-info">
        <span class="soul-name">${p.name}</span>
        <span class="soul-status">${p.id === activeSoulId ? '✓ Active' : 'Click to activate'}</span>
      </div>
    </div>
  `).join('')

    // Add click handlers
    soulsList.querySelectorAll('.soul-item').forEach(item => {
        item.addEventListener('click', async () => {
            const id = item.getAttribute('data-id')
            await setState({ activeSoulId: id })
            loadSouls() // Refresh list
        })
    })
}

/**
 * Handle login
 */
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim()
    const password = passwordInput.value

    if (!email || !password) {
        errorMsg.textContent = 'Please enter email and password'
        return
    }

    loginBtn.disabled = true
    loginBtn.textContent = 'Signing in...'
    errorMsg.textContent = ''

    try {
        await signIn(email, password)
        await setState({ isAuthenticated: true, userId: email })
        showMain(email)
        await loadSouls()
    } catch (error: any) {
        errorMsg.textContent = error.message || 'Login failed'
    } finally {
        loginBtn.disabled = false
        loginBtn.textContent = 'Sign In'
    }
})

/**
 * Handle logout
 */
logoutBtn.addEventListener('click', async () => {
    await signOut()
    await setState({ isAuthenticated: false, userId: null, activeSoulId: null, souls: [] })
    showLogin()
})

/**
 * Initialize popup
 */
async function init(): Promise<void> {
    const authenticated = await isAuthenticated()

    if (authenticated) {
        const session = await getSession()
        showMain(session?.user.email || 'User')
        await loadSouls()
    } else {
        showLogin()
    }
}

init()
