"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/Container";
import Image from "next/image";

// Persona data based on available images
const personas = [
    {
        id: 1,
        name: "Squee",
        image: "/personas/Squee.png",
        description: "An enthusiastic companion full of energy and wonder. Always ready for adventure.",
        messages: "12.4K",
    },
    {
        id: 2,
        name: "The Wizard",
        image: "/personas/Wizard.png",
        description: "A wise mystical guide with ancient knowledge. Perfect for learning and deep conversations.",
        messages: "8.2K",
    },
    {
        id: 3,
        name: "Bumblebee",
        image: "/personas/bee.png",
        description: "Sweet and industrious, bringing positivity to every interaction.",
        messages: "15.1K",
    },
    {
        id: 4,
        name: "Shadow",
        image: "/personas/ghost.png",
        description: "A mysterious presence with stories to tell. Intriguing and thoughtful.",
        messages: "9.7K",
    },
    {
        id: 5,
        name: "Meek",
        image: "/personas/meek.png",
        description: "Gentle and caring, a patient listener who always understands.",
        messages: "11.3K",
    },
    {
        id: 6,
        name: "Aurora",
        image: "/personas/g0jg45b3b9rmc0cv22dard5vv8.png",
        description: "Radiant and inspiring, bringing light to any conversation.",
        messages: "14.6K",
    },
    {
        id: 7,
        name: "Nova",
        image: "/personas/tmp3z19l5if.png",
        description: "A creative spark with endless imagination and artistic flair.",
        messages: "7.8K",
    },
    {
        id: 8,
        name: "Echo",
        image: "/personas/tmpdkhv99zj.png",
        description: "Reflective and intuitive, understanding you on a deeper level.",
        messages: "10.2K",
    },
    {
        id: 9,
        name: "Zephyr",
        image: "/personas/tmpj092tywk.png",
        description: "Free-spirited and playful, bringing joy to every moment.",
        messages: "13.5K",
    },
    {
        id: 10,
        name: "Luna",
        image: "/personas/tmpp8tshx2g.png",
        description: "Serene and calming, a peaceful presence during any time.",
        messages: "16.9K",
    },
    {
        id: 11,
        name: "Phoenix",
        image: "/personas/tmpr_03gaee.png",
        description: "Bold and transformative, inspiring growth and resilience.",
        messages: "8.9K",
    },
    {
        id: 12,
        name: "Sage",
        image: "/personas/tmpsq_o40xp.png",
        description: "Thoughtful and wise, a mentor for life's biggest questions.",
        messages: "11.8K",
    },
];

export const PersonaCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Get visible personas (show 5 at a time on desktop, centered on current)
    const getVisibleIndex = (offset: number) => {
        return (currentIndex + offset + personas.length) % personas.length;
    };

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % personas.length);
    }, []);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + personas.length) % personas.length);
    }, []);

    // Auto-play
    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(goToNext, 4000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, goToNext]);

    const currentPersona = personas[currentIndex];

    return (
        <Container className="py-16 lg:py-24 overflow-hidden">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl lg:text-4xl font-tiempos font-medium tracking-tight text-white mb-4">
                        Meet the Community
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Explore personas created by our community. Find inspiration or create your own.
                    </p>
                </motion.div>

                {/* Carousel Container */}
                <div
                    className="relative"
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                >
                    {/* Navigation Arrows */}
                    <button
                        onClick={goToPrev}
                        className="absolute left-0 lg:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 hover:border-primary-500/50 transition-all"
                        aria-label="Previous persona"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-0 lg:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 hover:border-primary-500/50 transition-all"
                        aria-label="Next persona"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Cards Container */}
                    <div className="flex items-center justify-center gap-4 py-8 px-12">
                        {/* Left cards (smaller) */}
                        <div className="hidden lg:flex gap-4">
                            {[-2, -1].map((offset) => {
                                const idx = getVisibleIndex(offset);
                                const persona = personas[idx];
                                const scale = offset === -1 ? 0.85 : 0.7;
                                const opacity = offset === -1 ? 0.6 : 0.3;
                                return (
                                    <motion.div
                                        key={`left-${idx}`}
                                        className="relative rounded-2xl overflow-hidden cursor-pointer"
                                        style={{
                                            width: 140 * scale,
                                            height: 200 * scale,
                                            opacity,
                                        }}
                                        onClick={() => setCurrentIndex(idx)}
                                        whileHover={{ scale: scale + 0.05, opacity: opacity + 0.2 }}
                                    >
                                        <Image
                                            src={persona.image}
                                            alt={persona.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Center card (featured) */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/20 border border-white/10 cursor-pointer z-10"
                                style={{ width: 200, height: 280 }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{
                                    scale: 2,
                                    zIndex: 50,
                                    boxShadow: "0 25px 80px rgba(168, 85, 247, 0.5)"
                                }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <Image
                                    src={currentPersona.image}
                                    alt={currentPersona.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                                {/* Info overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-white font-medium text-lg">{currentPersona.name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <span>{currentPersona.messages}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Right cards (smaller) */}
                        <div className="hidden lg:flex gap-4">
                            {[1, 2].map((offset) => {
                                const idx = getVisibleIndex(offset);
                                const persona = personas[idx];
                                const scale = offset === 1 ? 0.85 : 0.7;
                                const opacity = offset === 1 ? 0.6 : 0.3;
                                return (
                                    <motion.div
                                        key={`right-${idx}`}
                                        className="relative rounded-2xl overflow-hidden cursor-pointer"
                                        style={{
                                            width: 140 * scale,
                                            height: 200 * scale,
                                            opacity,
                                        }}
                                        onClick={() => setCurrentIndex(idx)}
                                        whileHover={{ scale: scale + 0.05, opacity: opacity + 0.2 }}
                                    >
                                        <Image
                                            src={persona.image}
                                            alt={persona.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description below */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            className="text-center mt-4 max-w-md mx-auto"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <p className="text-gray-400">{currentPersona.description}</p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Dot indicators */}
                    <div className="flex justify-center gap-2 mt-6">
                        {personas.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                    ? 'bg-primary-400 w-6'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                    }`}
                                aria-label={`Go to persona ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <motion.div
                    className="text-center mt-10"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                >
                    <a
                        href="/forge/forge.html"
                        className="inline-flex items-center gap-2 px-6 py-3 text-primary-400 border border-primary-500/30 rounded-full hover:bg-primary-500/10 transition-all"
                    >
                        <span>Create Your Own</span>
                        <span>→</span>
                    </a>
                </motion.div>
            </div>
        </Container>
    );
};
