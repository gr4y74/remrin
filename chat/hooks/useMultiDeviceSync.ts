'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DevicePresence {
    device_id: string;
    online_at: string;
}

interface UseMultiDeviceSyncReturn {
    deviceId: string;
    activeDevices: string[];
    isMultiDevice: boolean;
}

/**
 * Generates a unique device ID and stores it in localStorage
 */
function generateDeviceId(): string {
    if (typeof window === 'undefined') return 'server';

    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
}

/**
 * Hook to detect and handle multi-device scenarios
 * Tracks active devices for the current user using Supabase Presence
 */
export function useMultiDeviceSync(userId: string | undefined): UseMultiDeviceSyncReturn {
    const [activeDevices, setActiveDevices] = useState<string[]>([]);
    const deviceId = useMemo(() => generateDeviceId(), []);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`user_devices:${userId}`, {
                config: {
                    presence: {
                        key: deviceId
                    }
                }
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const devices = Object.keys(state);
                setActiveDevices(devices);
                console.log('[MultiDevice] Active devices:', devices);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('[MultiDevice] Device joined:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('[MultiDevice] Device left:', key, leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track this device's presence
                    await channel.track({
                        device_id: deviceId,
                        online_at: new Date().toISOString()
                    });
                }
            });

        // Cleanup on unmount
        return () => {
            channel.untrack();
            channel.unsubscribe();
        };
    }, [userId, deviceId, supabase]);

    return {
        deviceId,
        activeDevices,
        isMultiDevice: activeDevices.length > 1
    };
}
