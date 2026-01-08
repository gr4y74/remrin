/**
 * CostTracker
 * 
 * Tracks TTS generation costs for billing, analytics, and budget management.
 * Stores cost data in the audio_costs database table.
 * 
 * Features:
 * - Record per-generation costs
 * - Daily/monthly cost aggregation
 * - Cost breakdown by persona/user
 * - Budget alerts and thresholds
 * - Cost estimation utilities
 */

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { VoiceProvider } from '@/types/audio';

// ============================================================================
// Types
// ============================================================================

export interface CostRecord {
    id?: string;
    persona_id?: string;
    user_id: string;
    provider: VoiceProvider;
    character_count: number;
    estimated_cost: number;
    model_id?: string;
    voice_id?: string;
    request_id?: string;
    created_at?: string;
}

export interface DailyCostSummary {
    date: string;
    total_characters: number;
    total_cost: number;
    generation_count: number;
    breakdown_by_provider: Record<VoiceProvider, {
        characters: number;
        cost: number;
        count: number;
    }>;
}

export interface MonthlyCostSummary {
    month: string;
    total_characters: number;
    total_cost: number;
    generation_count: number;
    daily_breakdown: DailyCostSummary[];
    breakdown_by_provider: Record<VoiceProvider, {
        characters: number;
        cost: number;
        count: number;
    }>;
}

export interface PersonaCostSummary {
    persona_id: string;
    persona_name?: string;
    total_characters: number;
    total_cost: number;
    generation_count: number;
    first_generation: string;
    last_generation: string;
}

export interface UserCostSummary {
    user_id: string;
    total_characters: number;
    total_cost: number;
    generation_count: number;
    first_generation: string;
    last_generation: string;
    breakdown_by_provider: Record<VoiceProvider, {
        characters: number;
        cost: number;
        count: number;
    }>;
}

export interface BudgetAlert {
    type: 'warning' | 'critical';
    message: string;
    current_cost: number;
    threshold: number;
    percentage: number;
}

export interface CostConfig {
    /** Daily budget threshold for warnings */
    dailyBudgetWarning?: number;
    /** Daily budget threshold for critical alerts */
    dailyBudgetCritical?: number;
    /** Monthly budget threshold for warnings */
    monthlyBudgetWarning?: number;
    /** Monthly budget threshold for critical alerts */
    monthlyBudgetCritical?: number;
}

// ============================================================================
// Cost Per Character by Provider
// ============================================================================

const COST_PER_CHARACTER: Record<VoiceProvider, number> = {
    edge: 0, // Free
    kokoro: 0, // Self-hosted
    elevenlabs: 0.00003, // $0.30 per 1000 chars (standard tier)
};

const COST_PER_CHARACTER_PREMIUM: Record<VoiceProvider, number> = {
    edge: 0,
    kokoro: 0,
    elevenlabs: 0.00009, // $0.90 per 1000 chars (professional tier)
};

// ============================================================================
// CostTracker Class
// ============================================================================

export class CostTracker {
    private config: CostConfig;

    constructor(config: CostConfig = {}) {
        this.config = {
            dailyBudgetWarning: config.dailyBudgetWarning ?? 5.00,
            dailyBudgetCritical: config.dailyBudgetCritical ?? 10.00,
            monthlyBudgetWarning: config.monthlyBudgetWarning ?? 50.00,
            monthlyBudgetCritical: config.monthlyBudgetCritical ?? 100.00,
        };
    }

    /**
     * Record a new generation cost
     */
    async recordGeneration(
        provider: VoiceProvider,
        characterCount: number,
        options: {
            userId: string;
            personaId?: string;
            modelId?: string;
            voiceId?: string;
            requestId?: string;
            isPremiumTier?: boolean;
        }
    ): Promise<CostRecord> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const costPerChar = options.isPremiumTier
            ? COST_PER_CHARACTER_PREMIUM[provider]
            : COST_PER_CHARACTER[provider];

        const estimatedCost = characterCount * costPerChar;

        const record: Omit<CostRecord, 'id' | 'created_at'> = {
            user_id: options.userId,
            persona_id: options.personaId,
            provider,
            character_count: characterCount,
            estimated_cost: estimatedCost,
            model_id: options.modelId,
            voice_id: options.voiceId,
            request_id: options.requestId,
        };

        const { data, error } = await supabase
            .from('audio_costs')
            .insert(record)
            .select()
            .single();

        if (error) {
            console.error('[CostTracker] Failed to record generation cost:', error);
            throw new Error(`Failed to record cost: ${error.message}`);
        }

        console.log(`[CostTracker] Recorded: ${characterCount} chars, $${estimatedCost.toFixed(6)} (${provider})`);

        return data as CostRecord;
    }

    /**
     * Get today's total cost
     */
    async getDailyCost(userId?: string): Promise<DailyCostSummary> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const today = new Date().toISOString().split('T')[0];

        let query = supabase
            .from('audio_costs')
            .select('*')
            .gte('created_at', `${today}T00:00:00Z`)
            .lt('created_at', `${today}T23:59:59Z`);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[CostTracker] Failed to get daily cost:', error);
            throw new Error(`Failed to get daily cost: ${error.message}`);
        }

        return this.aggregateCostRecords(today, data || []);
    }

    /**
     * Get current month's total cost
     */
    async getMonthlyCost(userId?: string): Promise<MonthlyCostSummary> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const month = startOfMonth.slice(0, 7); // YYYY-MM

        let query = supabase
            .from('audio_costs')
            .select('*')
            .gte('created_at', startOfMonth)
            .order('created_at', { ascending: true });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[CostTracker] Failed to get monthly cost:', error);
            throw new Error(`Failed to get monthly cost: ${error.message}`);
        }

        return this.aggregateMonthlyCostRecords(month, data || []);
    }

    /**
     * Get cost breakdown by persona
     */
    async getCostByPersona(personaId: string): Promise<PersonaCostSummary> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('audio_costs')
            .select('*')
            .eq('persona_id', personaId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[CostTracker] Failed to get persona cost:', error);
            throw new Error(`Failed to get persona cost: ${error.message}`);
        }

        const records = data || [];

        if (records.length === 0) {
            return {
                persona_id: personaId,
                total_characters: 0,
                total_cost: 0,
                generation_count: 0,
                first_generation: '',
                last_generation: '',
            };
        }

        return {
            persona_id: personaId,
            total_characters: records.reduce((sum, r) => sum + r.character_count, 0),
            total_cost: records.reduce((sum, r) => sum + r.estimated_cost, 0),
            generation_count: records.length,
            first_generation: records[0].created_at,
            last_generation: records[records.length - 1].created_at,
        };
    }

    /**
     * Get cost breakdown by user
     */
    async getCostByUser(userId: string): Promise<UserCostSummary> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('audio_costs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[CostTracker] Failed to get user cost:', error);
            throw new Error(`Failed to get user cost: ${error.message}`);
        }

        const records = data || [];

        if (records.length === 0) {
            return {
                user_id: userId,
                total_characters: 0,
                total_cost: 0,
                generation_count: 0,
                first_generation: '',
                last_generation: '',
                breakdown_by_provider: {} as Record<VoiceProvider, { characters: number; cost: number; count: number }>,
            };
        }

        const breakdown = this.calculateProviderBreakdown(records);

        return {
            user_id: userId,
            total_characters: records.reduce((sum, r) => sum + r.character_count, 0),
            total_cost: records.reduce((sum, r) => sum + r.estimated_cost, 0),
            generation_count: records.length,
            first_generation: records[0].created_at,
            last_generation: records[records.length - 1].created_at,
            breakdown_by_provider: breakdown,
        };
    }

    /**
     * Estimate cost before generation
     */
    estimateCost(
        text: string,
        provider: VoiceProvider,
        isPremiumTier: boolean = false
    ): { characters: number; estimatedCost: number; provider: VoiceProvider } {
        const characters = text.length;
        const costPerChar = isPremiumTier
            ? COST_PER_CHARACTER_PREMIUM[provider]
            : COST_PER_CHARACTER[provider];

        return {
            characters,
            estimatedCost: characters * costPerChar,
            provider,
        };
    }

    /**
     * Check if current spending exceeds budget thresholds
     */
    async checkBudgetAlerts(userId?: string): Promise<BudgetAlert[]> {
        const alerts: BudgetAlert[] = [];

        const dailyCost = await this.getDailyCost(userId);
        const monthlyCost = await this.getMonthlyCost(userId);

        // Daily warnings
        if (dailyCost.total_cost >= this.config.dailyBudgetCritical!) {
            alerts.push({
                type: 'critical',
                message: 'Daily spending limit exceeded!',
                current_cost: dailyCost.total_cost,
                threshold: this.config.dailyBudgetCritical!,
                percentage: (dailyCost.total_cost / this.config.dailyBudgetCritical!) * 100,
            });
        } else if (dailyCost.total_cost >= this.config.dailyBudgetWarning!) {
            alerts.push({
                type: 'warning',
                message: 'Approaching daily spending limit',
                current_cost: dailyCost.total_cost,
                threshold: this.config.dailyBudgetWarning!,
                percentage: (dailyCost.total_cost / this.config.dailyBudgetWarning!) * 100,
            });
        }

        // Monthly warnings
        if (monthlyCost.total_cost >= this.config.monthlyBudgetCritical!) {
            alerts.push({
                type: 'critical',
                message: 'Monthly spending limit exceeded!',
                current_cost: monthlyCost.total_cost,
                threshold: this.config.monthlyBudgetCritical!,
                percentage: (monthlyCost.total_cost / this.config.monthlyBudgetCritical!) * 100,
            });
        } else if (monthlyCost.total_cost >= this.config.monthlyBudgetWarning!) {
            alerts.push({
                type: 'warning',
                message: 'Approaching monthly spending limit',
                current_cost: monthlyCost.total_cost,
                threshold: this.config.monthlyBudgetWarning!,
                percentage: (monthlyCost.total_cost / this.config.monthlyBudgetWarning!) * 100,
            });
        }

        return alerts;
    }

    /**
     * Get all-time statistics
     */
    async getAllTimeStats(): Promise<{
        total_characters: number;
        total_cost: number;
        total_generations: number;
        unique_users: number;
        unique_personas: number;
        avg_characters_per_generation: number;
        breakdown_by_provider: Record<VoiceProvider, {
            characters: number;
            cost: number;
            count: number;
        }>;
    }> {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data, error } = await supabase
            .from('audio_costs')
            .select('*');

        if (error) {
            console.error('[CostTracker] Failed to get all-time stats:', error);
            throw new Error(`Failed to get all-time stats: ${error.message}`);
        }

        const records = data || [];

        if (records.length === 0) {
            return {
                total_characters: 0,
                total_cost: 0,
                total_generations: 0,
                unique_users: 0,
                unique_personas: 0,
                avg_characters_per_generation: 0,
                breakdown_by_provider: {} as Record<VoiceProvider, { characters: number; cost: number; count: number }>,
            };
        }

        const uniqueUsers = new Set(records.map(r => r.user_id)).size;
        const uniquePersonas = new Set(records.filter(r => r.persona_id).map(r => r.persona_id)).size;
        const totalCharacters = records.reduce((sum, r) => sum + r.character_count, 0);

        return {
            total_characters: totalCharacters,
            total_cost: records.reduce((sum, r) => sum + r.estimated_cost, 0),
            total_generations: records.length,
            unique_users: uniqueUsers,
            unique_personas: uniquePersonas,
            avg_characters_per_generation: Math.round(totalCharacters / records.length),
            breakdown_by_provider: this.calculateProviderBreakdown(records),
        };
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    private aggregateCostRecords(date: string, records: CostRecord[]): DailyCostSummary {
        const breakdown = this.calculateProviderBreakdown(records);

        return {
            date,
            total_characters: records.reduce((sum, r) => sum + r.character_count, 0),
            total_cost: records.reduce((sum, r) => sum + r.estimated_cost, 0),
            generation_count: records.length,
            breakdown_by_provider: breakdown,
        };
    }

    private aggregateMonthlyCostRecords(month: string, records: CostRecord[]): MonthlyCostSummary {
        // Group by day
        const dailyMap = new Map<string, CostRecord[]>();

        for (const record of records) {
            const day = record.created_at?.split('T')[0] || '';
            if (!dailyMap.has(day)) {
                dailyMap.set(day, []);
            }
            dailyMap.get(day)!.push(record);
        }

        const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, dayRecords]) =>
            this.aggregateCostRecords(date, dayRecords)
        );

        const breakdown = this.calculateProviderBreakdown(records);

        return {
            month,
            total_characters: records.reduce((sum, r) => sum + r.character_count, 0),
            total_cost: records.reduce((sum, r) => sum + r.estimated_cost, 0),
            generation_count: records.length,
            daily_breakdown: dailyBreakdown,
            breakdown_by_provider: breakdown,
        };
    }

    private calculateProviderBreakdown(records: CostRecord[]): Record<VoiceProvider, { characters: number; cost: number; count: number }> {
        const breakdown: Record<VoiceProvider, { characters: number; cost: number; count: number }> = {
            edge: { characters: 0, cost: 0, count: 0 },
            kokoro: { characters: 0, cost: 0, count: 0 },
            elevenlabs: { characters: 0, cost: 0, count: 0 },
        };

        for (const record of records) {
            const provider = record.provider as VoiceProvider;
            if (breakdown[provider]) {
                breakdown[provider].characters += record.character_count;
                breakdown[provider].cost += record.estimated_cost;
                breakdown[provider].count += 1;
            }
        }

        return breakdown;
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

let defaultTracker: CostTracker | null = null;

/**
 * Get the default CostTracker instance (singleton)
 */
export function getCostTracker(config?: CostConfig): CostTracker {
    if (!defaultTracker) {
        defaultTracker = new CostTracker(config);
    }
    return defaultTracker;
}

/**
 * Create a new CostTracker instance
 */
export function createCostTracker(config?: CostConfig): CostTracker {
    return new CostTracker(config);
}

export default CostTracker;
