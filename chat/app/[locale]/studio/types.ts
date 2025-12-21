// Soul Studio Types

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
    created_at?: string
    updated_at?: string
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
