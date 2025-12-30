// Soul Studio Types

export type ModerationStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended'

export interface SwagItem {
    name: string
    url: string
    image_url?: string
    type: 'Physical' | 'Digital'
}

export interface PersonaMetadata {
    // Visuals
    hero_image_url?: string
    appearance_prompt?: string
    negative_prompt?: string
    // Voice
    voice_sample_url?: string
    // Store
    swag_items?: SwagItem[]
    is_official?: boolean
    price?: number
}

// Soul Splicer DNA Config
export interface DNASplicing {
    donors: string[]
    synthesis_logic: string
    weights: Record<string, number>
}

// Advanced Brain Parameters
export interface BrainParams {
    temperature: number
    top_p: number
    frequency_penalty: number
}

// Persona Config JSON structure (stored in personas.config)
export interface PersonaConfig {
    dna_splicing?: DNASplicing
    brain_params?: BrainParams
    locket_protocol?: { enabled: boolean }
    safety_lock?: boolean
}

export interface StudioPersona {
    id?: string
    name: string
    tagline?: string
    description?: string
    system_prompt: string
    behavioral_blueprint: Record<string, unknown> | null
    image_url?: string
    voice_id?: string
    base_model?: string
    safety_level?: 'CHILD' | 'TEEN' | 'ADULT'
    visibility: 'PUBLIC' | 'PRIVATE'
    owner_id?: string
    metadata: PersonaMetadata
    config?: PersonaConfig  // Soul Studio v2.0 config (DNA, Brain Params, Safety Lock)
    created_at?: string
    updated_at?: string
    // Moderation fields
    status: ModerationStatus
    category?: string
    tags?: string[]
    intro_message?: string
    is_featured?: boolean
    submitted_at?: string
    reviewed_at?: string
    reviewed_by?: string
    rejection_reason?: string
}

export interface Category {
    id: string
    slug: string
    name: string
    description?: string
    icon?: string
    color?: string
    sort_order: number
    is_active: boolean
}

export interface ModerationAction {
    id: string
    persona_id: string
    moderator_id: string
    action: 'submit' | 'approve' | 'reject' | 'suspend' | 'feature' | 'unfeature'
    reason?: string
    metadata?: Record<string, unknown>
    created_at: string
}

export const DEFAULT_PERSONA: StudioPersona = {
    name: '',
    tagline: '',
    description: '',
    system_prompt: '',
    behavioral_blueprint: null,
    image_url: '',
    voice_id: '',
    base_model: 'deepseek-chat',
    safety_level: 'ADULT',
    visibility: 'PRIVATE',
    status: 'draft',
    category: 'general',
    tags: [],
    metadata: {}
}

export const BASE_MODELS = [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gpt-4o', label: 'GPT-4o' }
]

export const SAFETY_LEVELS = [
    { value: 'CHILD', label: '🧸 Child (Strict Safety)' },
    { value: 'TEEN', label: '⚡ Teen (PG-13)' },
    { value: 'ADULT', label: '🔞 Adult (Unrestricted)' }
]

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, { label: string; color: string; icon: string }> = {
    draft: { label: 'Draft', color: 'text-rp-subtle', icon: '📝' },
    pending_review: { label: 'Pending Review', color: 'text-rp-gold', icon: '⏳' },
    approved: { label: 'Approved', color: 'text-rp-foam', icon: '✅' },
    rejected: { label: 'Rejected', color: 'text-rp-love', icon: '❌' },
    suspended: { label: 'Suspended', color: 'text-rp-gold', icon: '🚫' }
}

export const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', slug: 'general', name: 'General', icon: '🌟', color: '#6366f1', sort_order: 0, is_active: true },
    { id: '2', slug: 'romance', name: 'Romance', icon: '💕', color: '#ec4899', sort_order: 1, is_active: true },
    { id: '3', slug: 'adventure', name: 'Adventure', icon: '⚔️', color: '#f59e0b', sort_order: 2, is_active: true },
    { id: '4', slug: 'helper', name: 'Helper', icon: '🧠', color: '#10b981', sort_order: 3, is_active: true },
    { id: '5', slug: 'anime', name: 'Anime & Game', icon: '🎮', color: '#8b5cf6', sort_order: 4, is_active: true },
    { id: '6', slug: 'original', name: 'Original', icon: '✨', color: '#06b6d4', sort_order: 5, is_active: true },
    { id: '7', slug: 'education', name: 'Education', icon: '📚', color: '#3b82f6', sort_order: 6, is_active: true }
]

