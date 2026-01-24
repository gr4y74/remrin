'use client';

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 * Registers the messenger service worker for PWA functionality
 */
export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // Register service worker after page load
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/messenger-sw.js', {
                        scope: '/aol/messenger'
                    });

                    console.log('[SW] Service Worker registered successfully:', registration.scope);

                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Check every minute

                    // Handle service worker updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New service worker available
                                    console.log('[SW] New service worker available');
                                    // Optionally show update notification to user
                                }
                            });
                        }
                    });
                } catch (error) {
                    console.error('[SW] Service Worker registration failed:', error);
                }
            });
        } else {
            console.warn('[SW] Service Workers are not supported in this browser');
        }
    }, []);

    return null; // This component doesn't render anything
}
