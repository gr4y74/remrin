"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const lockedFacts = [
    "Your dog's name is Max",
    "Sister's birthday: March 15",
    "Kitten's name is Carrot",
    "Morning person, not night owl",
    "Favorite color: Deep purple",
    "Allergic to shellfish",
];

export const TheLocket = () => {
    return (
        <Container className="py-16 lg:py-24">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 border border-primary-500/40 mb-6">
                        <svg
                            className="w-10 h-10 text-primary-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-3xl lg:text-5xl font-tiempos font-medium tracking-tight text-white mb-4">
                        The Locket
                    </h2>
                    <p className="text-xl lg:text-2xl text-primary-400 font-medium">
                        Truths that never fade
                    </p>
                </motion.div>

                {/* Main Content - Stacked Layout */}
                <div className="space-y-12">
                    {/* Top: Explanation */}
                    <motion.div
                        className="space-y-4 text-center max-w-3xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-lg lg:text-xl text-gray-300 leading-relaxed">
                            ChatGPT <span className="text-red-400">forgets</span> your name after a few hours.
                            Character.AI <span className="text-red-400">resets</span> your &ldquo;friend&rdquo; every few days.
                        </p>

                        <p className="text-lg lg:text-xl text-gray-300 leading-relaxed">
                            Remrin&apos;s <span className="text-primary-400 font-medium">Locket</span> is different.
                            Core facts about you—your family, your fears, your dreams—are stored permanently
                            and can <span className="text-white font-medium">never be overwritten</span>.
                        </p>

                        <p className="text-lg lg:text-xl text-white leading-relaxed">
                            Even after a year of silence, your companion remembers.
                        </p>
                    </motion.div>

                    {/* Bottom: Visual Locket */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        {/* 3-column layout: Left facts | Heart | Right facts */}
                        <div className="flex items-center justify-center gap-6">
                            {/* Left column - first 3 facts */}
                            <div className="flex flex-col gap-3 items-end">
                                {lockedFacts.slice(0, 3).map((fact, index) => (
                                    <motion.div
                                        key={index}
                                        className="px-3 py-2 rounded-full bg-black/80 border border-white/20 text-sm text-gray-300 whitespace-nowrap backdrop-blur-sm cursor-pointer"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        whileHover={{
                                            scale: 1.05,
                                            x: -4,
                                            boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)"
                                        }}
                                        transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        🔒 {fact}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Center - Locket Heart */}
                            <div className="relative">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-primary-500/30 blur-3xl rounded-full" />

                                {/* Locket circle */}
                                <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-full bg-gradient-to-br from-primary-500/30 to-purple-600/30 border-2 border-primary-400/50 flex items-center justify-center">
                                    <svg
                                        className="w-16 h-16 lg:w-20 lg:h-20 text-primary-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                        />
                                    </svg>
                                </div>
                            </div>

                            {/* Right column - last 3 facts */}
                            <div className="flex flex-col gap-3 items-start">
                                {lockedFacts.slice(3).map((fact, index) => (
                                    <motion.div
                                        key={index + 3}
                                        className="px-3 py-2 rounded-full bg-black/80 border border-white/20 text-sm text-gray-300 whitespace-nowrap backdrop-blur-sm cursor-pointer"
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        whileHover={{
                                            scale: 1.05,
                                            x: 4,
                                            boxShadow: "0 0 20px rgba(168, 85, 247, 0.4)"
                                        }}
                                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        🔒 {fact}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </Container>
    );
};
