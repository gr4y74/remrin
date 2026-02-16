import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/browser-client';
import { useAuth } from './useAuth';

export interface Subscription {
    id: string;
    user_id: string;
    tier: 'wanderer' | 'soul_weaver' | 'architect' | 'titan';
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
    current_period_end: string;
    cancel_at_period_end: boolean;
    messages_used_this_month: number;
    monthly_message_limit: number | null;
}

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const userId = user.id;

        async function fetchSubscription() {
            try {
                const { data, error } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching subscription:', error);
                } else if (!data) {
                    // No subscription found, default to free/wanderer
                    setSubscription({
                        id: 'none',
                        user_id: userId,
                        tier: 'wanderer',
                        status: 'active',
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        cancel_at_period_end: false,
                        messages_used_this_month: 0,
                        monthly_message_limit: 100
                    });
                } else {
                    // Map wallet data to subscription interface
                    setSubscription({
                        id: data.user_id,
                        user_id: data.user_id,
                        tier: data.tier as any,
                        status: 'active',
                        current_period_end: data.updated_at || data.created_at,
                        cancel_at_period_end: false,
                        messages_used_this_month: 0, // Not present in wallet
                        monthly_message_limit: 100 // Not present in wallet
                    });
                }
            } catch (err) {
                console.error('Failed to fetch subscription:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchSubscription();
    }, [user]);

    return { subscription, loading };
}
