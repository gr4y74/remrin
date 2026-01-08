// VoiceCard.tsx
import React from 'react';
import { IconHeart, IconPlayerPlay, IconStar } from '@tabler/icons-react';

export interface VoiceCardProps {
    voiceId: string;
    name: string;
    creator?: string; // optional, for community voices
    language: string;
    accent?: string;
    useCases: string[];
    isPremium: boolean;
    isFavorite: boolean;
    onPreview: (voiceId: string) => void;
    onToggleFavorite: (voiceId: string) => void;
}

export const VoiceCard: React.FC<VoiceCardProps> = ({
    voiceId,
    name,
    creator,
    language,
    accent,
    useCases,
    isPremium,
    isFavorite,
    onPreview,
    onToggleFavorite,
}) => {
    const handlePreview = () => onPreview(voiceId);
    const handleFavorite = () => onToggleFavorite(voiceId);

    return (
        <div className="voice-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-gray-800">{name}</h3>
                {isPremium && (
                    <span className="badge bg-yellow-400 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center">
                        <IconStar className="mr-1 h-3 w-3" /> Premium
                    </span>
                )}
            </div>
            {creator && (
                <p className="text-sm text-gray-500 mb-1">by {creator}</p>
            )}
            <p className="text-sm text-gray-600 mb-1">
                {language}{accent ? ` – ${accent}` : ''}
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
                {useCases.map((caseTag) => (
                    <span
                        key={caseTag}
                        className="tag bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs"
                    >
                        {caseTag}
                    </span>
                ))}
            </div>
            <div className="flex space-x-2 mt-2">
                <button
                    onClick={handlePreview}
                    className="btn-preview flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                >
                    <IconPlayerPlay className="h-4 w-4" /> Preview
                </button>
                <button
                    onClick={handleFavorite}
                    className={`btn-fav flex items-center gap-1 px-3 py-1 rounded ${isFavorite ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-800'} `}
                >
                    <IconHeart className="h-4 w-4" /> {isFavorite ? 'Unfavorite' : 'Favorite'}
                </button>
            </div>
        </div>
    );
};
