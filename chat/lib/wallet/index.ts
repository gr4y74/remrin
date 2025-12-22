import { SupabaseClient } from "@supabase/supabase-js"

export interface Wallet {
    user_id: string
    balance_aether: number
    balance_brain: number
    is_creator: boolean
    total_earned: number
    total_spent: number
    created_at?: string
    updated_at?: string
}

export type BalanceType = "aether" | "brain"

/**
 * Fetch a user's wallet
 */
export async function getWallet(
    supabase: SupabaseClient,
    userId: string
): Promise<Wallet | null> {
    const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single()

    if (error) {
        console.error("Error fetching wallet:", error)
        return null
    }

    return data as Wallet
}

/**
 * Check if a user has enough balance
 */
export async function hasBalance(
    supabase: SupabaseClient,
    userId: string,
    amount: number,
    type: BalanceType = "aether"
): Promise<boolean> {
    const wallet = await getWallet(supabase, userId)

    if (!wallet) {
        return false
    }

    const balance =
        type === "brain" ? wallet.balance_brain : wallet.balance_aether

    return balance >= amount
}

/**
 * Deduct balance from a user's wallet
 */
export async function deductBalance(
    supabase: SupabaseClient,
    userId: string,
    amount: number,
    type: BalanceType = "aether"
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    // First check if user has enough balance
    const wallet = await getWallet(supabase, userId)

    if (!wallet) {
        return { success: false, newBalance: 0, error: "Wallet not found" }
    }

    const currentBalance =
        type === "brain" ? wallet.balance_brain : wallet.balance_aether

    if (currentBalance < amount) {
        return {
            success: false,
            newBalance: currentBalance,
            error: "Insufficient balance"
        }
    }

    const newBalance = currentBalance - amount
    const updateData =
        type === "brain"
            ? {
                balance_brain: newBalance,
                total_spent: wallet.total_spent + amount
            }
            : {
                balance_aether: newBalance,
                total_spent: wallet.total_spent + amount
            }

    const { error } = await supabase
        .from("wallets")
        .update(updateData)
        .eq("user_id", userId)

    if (error) {
        console.error("Error deducting balance:", error)
        return { success: false, newBalance: currentBalance, error: error.message }
    }

    return { success: true, newBalance }
}

/**
 * Add balance to a user's wallet
 */
export async function addBalance(
    supabase: SupabaseClient,
    userId: string,
    amount: number,
    type: BalanceType = "aether"
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const wallet = await getWallet(supabase, userId)

    if (!wallet) {
        return { success: false, newBalance: 0, error: "Wallet not found" }
    }

    const currentBalance =
        type === "brain" ? wallet.balance_brain : wallet.balance_aether
    const newBalance = currentBalance + amount

    const updateData =
        type === "brain"
            ? {
                balance_brain: newBalance,
                total_earned: wallet.total_earned + amount
            }
            : {
                balance_aether: newBalance,
                total_earned: wallet.total_earned + amount
            }

    const { error } = await supabase
        .from("wallets")
        .update(updateData)
        .eq("user_id", userId)

    if (error) {
        console.error("Error adding balance:", error)
        return { success: false, newBalance: currentBalance, error: error.message }
    }

    return { success: true, newBalance }
}

/**
 * Create a wallet for a new user (fallback if trigger fails)
 */
export async function createWallet(
    supabase: SupabaseClient,
    userId: string
): Promise<Wallet | null> {
    const { data, error } = await supabase
        .from("wallets")
        .insert({ user_id: userId })
        .select("*")
        .single()

    if (error) {
        console.error("Error creating wallet:", error)
        return null
    }

    return data as Wallet
}

/**
 * Ensure a wallet exists for a user, creating one if necessary
 */
export async function ensureWallet(
    supabase: SupabaseClient,
    userId: string
): Promise<Wallet | null> {
    let wallet = await getWallet(supabase, userId)

    if (!wallet) {
        wallet = await createWallet(supabase, userId)
    }

    return wallet
}
