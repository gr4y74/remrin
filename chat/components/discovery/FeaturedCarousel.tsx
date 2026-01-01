/**
 * Featured Carousel Component
 * 
 * 3D carousel for featured characters with real character data and links
 */

"use client"

import React, { useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface FeaturedCharacter {
    id: string
    name: string
    imageUrl: string
}

interface FeaturedCarouselProps {
    characters: FeaturedCharacter[]
    onCharacterClick?: (character: FeaturedCharacter) => void
}

export function FeaturedCarousel({ characters, onCharacterClick }: FeaturedCarouselProps) {
    // Start at middle for symmetrical display
    const [currentIndex, setCurrentIndex] = useState(Math.floor(characters.length / 2))
    const router = useRouter()

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? characters.length - 1 : prevIndex - 1
        )
    }

    const goToNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === characters.length - 1 ? 0 : prevIndex + 1
        )
    }

    const getCardStyle = (index: number) => {
        const diff = index - currentIndex
        const absPos = Math.abs(diff)

        if (absPos > 2) return { display: 'none' as const }

        // Center card
        if (diff === 0) {
            return {
                transform: 'translateX(0) translateZ(0) scale(1)',
                opacity: 1,
                zIndex: 3
            }
        }

        // Side cards
        return {
            transform: `translateX(${diff * 280}px) translateZ(-${absPos * 200}px) scale(${1 - absPos * 0.15})`,
            opacity: 1 - absPos * 0.3,
            zIndex: 3 - absPos
        }
    }

    const handleCardClick = (character: FeaturedCharacter, isCenter: boolean) => {
        if (isCenter) {
            if (onCharacterClick) {
                onCharacterClick(character)
            } else {
                router.push(`/character/${character.id}`)
            }
        } else {
            // Navigate to this card
            const index = characters.findIndex(c => c.id === character.id)
            if (index !== -1) setCurrentIndex(index)
        }
    }

    if (characters.length === 0) return null

    return (
        <div className="w-full py-8">
            <div className="w-full max-w-7xl mx-auto">
                {/* Carousel Container */}
                <div className="relative" style={{ perspective: '2000px' }}>
                    {/* Navigation Buttons */}
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-rp-surface text-rp-iris border-2 border-rp-iris hover:bg-rp-iris hover:text-white rounded-full flex items-center justify-center transition-all"
                        aria-label="Previous"
                    >
                        <IconChevronLeft size={32} />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-rp-surface text-rp-iris border-2 border-rp-iris hover:bg-rp-iris hover:text-white rounded-full flex items-center justify-center transition-all"
                        aria-label="Next"
                    >
                        <IconChevronRight size={32} />
                    </button>

                    {/* Cards Container */}
                    <div className="relative h-[600px] flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                        {characters.map((character, index) => {
                            const isCenter = index === currentIndex
                            return (
                                <div
                                    key={character.id}
                                    className="absolute transition-all duration-500 ease-out cursor-pointer"
                                    style={getCardStyle(index)}
                                    onClick={() => handleCardClick(character, isCenter)}
                                >
                                    {/* Card */}
                                    <div className={cn(
                                        "relative w-[320px] h-[480px] rounded-xl overflow-hidden group",
                                        "border-2 transition-all duration-300",
                                        isCenter ? "border-rp-iris/60" : "border-rp-muted/20"
                                    )}>
                                        {/* Character Image */}
                                        <Image
                                            src={character.imageUrl}
                                            alt={character.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            sizes="320px"
                                            priority={index < 3}
                                        />

                                        {/* Card Content */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6">
                                            <h3 className="text-white text-2xl font-bold mb-4 font-tiempos-headline" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                                                {character.name}
                                            </h3>

                                            {/* Button - only show on center card */}
                                            {isCenter && (
                                                <button
                                                    className={cn(
                                                        "inline-flex items-center gap-2 px-6 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg font-semibold",
                                                        "bg-gradient-to-r from-rp-iris to-rp-rose text-rp-base",
                                                        "hover:from-rp-iris/80 hover:to-rp-rose/80"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleCardClick(character, true)
                                                    }}
                                                >
                                                    <span>Chat Now</span>
                                                </button>
                                            )}
                                        </div>

                                        {/* Hover Border Effect */}
                                        <div className={cn(
                                            "absolute inset-0 rounded-xl transition-all duration-300",
                                            "border-2",
                                            isCenter ? "border-rp-iris/30" : "border-white/0 group-hover:border-white/30"
                                        )}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Dots Navigation */}
                    <div className="flex justify-center gap-2 mt-8">
                        {characters.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={cn(
                                    "h-2 rounded-full transition-all",
                                    index === currentIndex
                                        ? 'bg-rp-iris w-8'
                                        : 'bg-rp-muted/30 hover:bg-rp-muted/50 w-2'
                                )}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
