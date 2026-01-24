import { useState, useEffect } from 'react';

interface OfflineMessage {
    id: string;
    partnerId: string;
    partnerUsername: string;
    text: string;
    timestamp: number;
}

/**
 * Hook to manage offline message queue
 * Messages are queued when offline and sent when connection is restored
 */
export function useOfflineQueue() {
    const [isOnline, setIsOnline] = useState(true);
    const [queueSize, setQueueSize] = useState(0);

    useEffect(() => {
        // Update online status
        const updateOnlineStatus = () => {
            setIsOnline(navigator.onLine);
        };

        updateOnlineStatus();
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    // Add message to queue
    const addToQueue = async (message: Omit<OfflineMessage, 'id' | 'timestamp'>) => {
        const queuedMessage: OfflineMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };

        try {
            const db = await openDB();
            const tx = db.transaction('pending-messages', 'readwrite');
            await tx.objectStore('pending-messages').add(queuedMessage);

            // Update queue size
            const countRequest = tx.objectStore('pending-messages').count();
            countRequest.onsuccess = () => {
                setQueueSize(countRequest.result);
            };

            // Register background sync if available
            if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                // @ts-ignore - sync property is non-standard but supported in some browsers
                await (registration as any).sync.register('sync-messages');
            }

            return { success: true, id: queuedMessage.id };
        } catch (error) {
            console.error('Failed to queue message:', error);
            return { success: false, error };
        }
    };

    // Get queue size
    const getQueueSize = async () => {
        try {
            const db = await openDB();
            const tx = db.transaction('pending-messages');
            const countRequest = tx.objectStore('pending-messages').count();

            return new Promise<number>((resolve) => {
                countRequest.onsuccess = () => {
                    const count = countRequest.result;
                    setQueueSize(count);
                    resolve(count);
                };
                countRequest.onerror = () => {
                    console.error('Failed to get queue size request:', countRequest.error);
                    resolve(0);
                };
            });
        } catch (error) {
            console.error('Failed to get queue size:', error);
            return 0;
        }
    };

    // Clear queue
    const clearQueue = async () => {
        try {
            const db = await openDB();
            await db.transaction('pending-messages', 'readwrite').objectStore('pending-messages').clear();
            setQueueSize(0);
            return { success: true };
        } catch (error) {
            console.error('Failed to clear queue:', error);
            return { success: false, error };
        }
    };

    useEffect(() => {
        getQueueSize();
    }, []);

    return {
        isOnline,
        queueSize,
        addToQueue,
        getQueueSize,
        clearQueue
    };
}

// Helper: Open IndexedDB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('remrin-messenger', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('pending-messages')) {
                db.createObjectStore('pending-messages', { keyPath: 'id' });
            }
        };
    });
}
