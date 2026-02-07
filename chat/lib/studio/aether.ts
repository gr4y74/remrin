/**
 * AetherService
 * Handles credit calculation and user balance validation for AI Studio.
 */

export class AetherService {
    /**
     * Calculates the Aether cost based on Replicate's base cost.
     * Minimum 2x markup, rounded to "nice" numbers.
     */
    static calculateCost(baseCostUsd: number): number {
        // Implementation based on specifications
        const baseAether = Math.ceil(baseCostUsd * 2000); // Assuming 1 Aether = $0.001 roughly for scaling

        // Match the pricing logic in specifications
        if (baseAether < 10) return Math.ceil(baseAether / 5) * 5;
        if (baseAether < 100) return Math.ceil(baseAether / 10) * 10;
        if (baseAether < 500) return Math.ceil(baseAether / 25) * 25;
        return Math.ceil(baseAether / 50) * 50;
    }

    /**
     * Deducts Aether from a user's account.
     * This would normally interact with a 'user_balances' or 'profiles' table.
     */
    static async deductCredits(supabase: any, userId: string, amount: number) {
        // Check balance first
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('aether_balance')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            throw new Error("Could not verify Aether balance");
        }

        if (profile.aether_balance < amount) {
            throw new Error("Insufficient Aether. Please top up your balance.");
        }

        // Deduct
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ aether_balance: profile.aether_balance - amount })
            .eq('id', userId);

        if (updateError) {
            throw new Error("Failed to process Aether transaction");
        }

        return true;
    }

    /**
     * Refunds Aether in case of generation failure.
     */
    static async refundCredits(supabase: any, userId: string, amount: number) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('aether_balance')
            .eq('id', userId)
            .single();

        if (profile) {
            await supabase
                .from('profiles')
                .update({ aether_balance: (profile.aether_balance || 0) + amount })
                .eq('id', userId);
        }
    }
}
