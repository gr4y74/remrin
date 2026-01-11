'use client';
import { useState, useEffect } from 'react';

export function useAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        // Simulate API fetch
        const timer = setTimeout(() => {
            setData({
                overview: [
                    { label: 'Total Views', value: '45.2K', trend: '+12%', positive: true },
                    { label: 'Engagement Rate', value: '5.8%', trend: '+0.5%', positive: true },
                    { label: 'New Followers', value: '1,280', trend: '-2%', positive: false },
                    { label: 'Avg. Time Spent', value: '4m 12s', trend: '+15%', positive: true },
                ],
                profileViews: Array.from({ length: 30 }, (_, i) => ({
                    date: `Jan ${i + 1}`,
                    views: Math.floor(Math.random() * 1000) + 500,
                })),
                engagement: [
                    { name: 'Mon', likes: 400, comments: 240, shares: 120 },
                    { name: 'Tue', likes: 300, comments: 139, shares: 80 },
                    { name: 'Wed', likes: 200, comments: 980, shares: 200 },
                    { name: 'Thu', likes: 278, comments: 390, shares: 150 },
                    { name: 'Fri', likes: 189, comments: 480, shares: 110 },
                    { name: 'Sat', likes: 239, comments: 380, shares: 130 },
                    { name: 'Sun', likes: 349, comments: 430, shares: 190 },
                ],
                followerGrowth: Array.from({ length: 12 }, (_, i) => ({
                    date: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
                    followers: 1000 + (i * 200) + Math.floor(Math.random() * 300),
                })),
                topContent: [
                    { id: '1', title: 'Why Rose Pine is the best theme for devs', views: 5400, likes: 1200, comments: 45, shares: 89 },
                    { id: '2', title: 'Remrin Social: The future of AI interaction', views: 4200, likes: 980, comments: 32, shares: 45 },
                    { id: '3', title: 'How to build an analytics dashboard in 2 hours', views: 3800, likes: 850, comments: 28, shares: 33 },
                    { id: '4', title: 'The secret to viral posts in 2026', views: 2900, likes: 640, comments: 19, shares: 21 },
                ],
                activity: Array.from({ length: 84 }, (_, i) => ({
                    date: `2026-01-${i + 1}`,
                    count: Math.floor(Math.random() * 25),
                })),
                insights: [
                    {
                        type: 'time',
                        title: 'Optimal Posting Time',
                        description: 'Your audience is most active between 6 PM and 9 PM UTC.',
                        value: 'Tue, 7:30 PM'
                    },
                    {
                        type: 'content',
                        title: 'Top Content Format',
                        description: 'Video posts get 2.4x more engagement than static images.',
                        value: 'Vertical Video'
                    },
                    {
                        type: 'growth',
                        title: 'Growth Spike Detected',
                        description: 'Followers increased by 20% after sharing "Rose Pine Theme" post.',
                        value: '+240 followers'
                    },
                    {
                        type: 'general',
                        title: 'Engagement Tip',
                        description: 'Responding to comments within 1 hour increases reach by 15%.',
                        value: 'Pro Active'
                    },
                ]
            });
            setLoading(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    return { data, loading };
}
