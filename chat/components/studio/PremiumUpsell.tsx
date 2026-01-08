// PremiumUpsell.tsx
import React from 'react';
import { IconArrowRight, IconCheck } from '@tabler/icons-react';

export const PremiumUpsell: React.FC = () => {
    return (
        <div className="premium-upsell bg-gradient-to-r from-yellow-400 to-amber-500 p-6 rounded-lg shadow-lg text-white max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Unlock Premium Voices</h2>
            <p className="mb-4">
                Experience the highest quality, natural‑sounding voices from ElevenLabs. Premium voices give you:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-1">
                <li className="flex items-center"><IconCheck className="mr-2 h-4 w-4" /> Unlimited usage</li>
                <li className="flex items-center"><IconCheck className="mr-2 h-4 w-4" /> Commercial license</li>
                <li className="flex items-center"><IconCheck className="mr-2 h-4 w-4" /> Priority support</li>
                <li className="flex items-center"><IconCheck className="mr-2 h-4 w-4" /> Access to new voices first</li>
            </ul>
            <div className="flex items-center justify-between">
                <span className="text-xl font-semibold">$19.99 / month</span>
                <button className="flex items-center gap-1 bg-white text-yellow-600 font-medium px-4 py-2 rounded hover:bg-gray-100 transition">
                    Upgrade Now <IconArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
