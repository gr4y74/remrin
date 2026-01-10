'use client';

import confetti from 'canvas-confetti';

export class BadgeNotifier {
    static celebrateBadge(badgeName: string) {
        // Confetti animation
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#9C27B0', '#1E88E5', '#43A047', '#FFA726', '#EF5350'],
        });

        // Show toast notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                new Notification('Achievement Unlocked!', {
                    body: `You earned: ${badgeName}`,
                    icon: '/badge-icon.png',
                });
            }
        }
    }

    static async requestPermission() {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            await Notification.requestPermission();
        }
    }
}
