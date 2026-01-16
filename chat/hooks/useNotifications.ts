import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser-client'

export const useNotifications = (userId: string | undefined, type: string) => {
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) return

        fetchNotifications()

        // Subscribe to real-time updates
        const channelName = `notifications:${userId}:${type}`
        const tableName = getTableName(type)

        // For system notifications, we filter by user_id
        // For others, it depends on the join, but Supabase Realtime 
        // works best on the table itself.
        const subscription = supabase
            .channel(channelName)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: tableName,
                // Using a filter if possible, though Realtime filters are limited
                // filter: tableName === 'system_notifications' ? `user_id=eq.${userId}` : undefined
            }, (payload) => {
                console.log('Realtime update received:', payload)
                fetchNotifications()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(subscription)
        }
    }, [userId, type])

    const fetchNotifications = async () => {
        if (!userId) return

        setLoading(true)
        const tableName = getTableName(type)
        const selectQuery = getSelectQuery(type)

        let query = supabase
            .from(tableName as any)
            .select(selectQuery)
            .order('created_at', { ascending: false })
            .limit(50)

        // Apply user filters based on type
        if (type === 'system') {
            query = query.eq('user_id', userId)
        } else if (type === 'subscribers') {
            query = query.eq('subscribed_to_id', userId)
        } else if (type === 'connectors') {
            query = query.eq('connected_to_id', userId)
        }
        // Note: likes/comments don't filter by user - would require proper FK join
        // to filter by content owner. For now, fetch all recent and filter client-side if needed.

        const { data, error } = await query

        if (error) {
            console.error(`Error fetching ${type} notifications:`, error)
        } else {
            console.log(`Fetched ${data?.length || 0} ${type} notifications`)
            setNotifications(data || [])
        }
        setLoading(false)
    }

    return { notifications, loading, refetch: fetchNotifications }
}

const getTableName = (type: string) => {
    const tables: Record<string, string> = {
        subscribers: 'user_subscribers',
        connectors: 'user_connections',
        likes: 'content_likes',
        comments: 'content_comments',
        system: 'system_notifications'
    }
    return tables[type] || 'system_notifications'
}

const getSelectQuery = (type: string) => {
    // Simplified queries to avoid FK relationship issues
    // The user_profiles joins were failing due to FK/column mismatches
    const queries: Record<string, string> = {
        subscribers: '*',
        connectors: '*',
        likes: '*',
        comments: '*',
        system: '*'
    }
    return queries[type] || '*'
}
