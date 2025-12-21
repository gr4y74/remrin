"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const useCases = [
    {
        emoji: "👨‍👩‍👧‍👦",
        title: "For Parents",
        headline: "Turn Homework Into an Adventure",
        description: "Watch your kids engage with learning when their favorite character explains math, reads bedtime stories, or practices spelling.",
        color: "from-blue-500/20 to-cyan-500/20",
        borderColor: "border-blue-500/30",
        example: "\"Sonic helped Zizo do 3 hours of homework without complaining.\"",
    },
    {
        emoji: "💙",
        title: "For Anyone Struggling",
        headline: "A Friend Who's Always There",
        description: "Someone who listens without judgment. Someone who remembers what you're going through. Available 24/7, whenever you need support.",
        color: "from-purple-500/20 to-pink-500/20",
        borderColor: "border-purple-500/30",
        example: "\"When I couldn't talk to anyone else, I could talk to Rem.\"",
    },
    {
        emoji: "✨",
        title: "For Creators",
        headline: "Build AI Characters That Feel Alive",
        description: "Create companions with deep personalities, unique voices, and memories that persist. Share them with the world or keep them personal.",
        color: "from-amber-500/20 to-orange-500/20",
        borderColor: "border-amber-500/30",
        example: "\"I created a writing partner who actually understands my story.\"",
    },
];

export const UseCases = () => {
    return (
        <Container className="py-16 lg:py-24">
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
                        Who Is This For?
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Remrin adapts to your needs. Find where you fit.
                    </p>
                </motion.div>

                {/* Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {useCases.map((useCase, index) => (
                        <motion.div
                            key={useCase.title}
                            className={`relative p-6 rounded-2xl bg-gradient-to-br ${useCase.color} border ${useCase.borderColor} backdrop-blur-sm`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            {/* Emoji */}
                            <div className="text-4xl mb-4">{useCase.emoji}</div>

                            {/* Label */}
                            <div className="text-sm text-gray-400 mb-2">{useCase.title}</div>

                            {/* Headline */}
                            <h3 className="text-xl font-medium text-white mb-3">
                                {useCase.headline}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-400 leading-relaxed mb-4">
                                {useCase.description}
                            </p>

                            {/* Example quote */}
                            <p className="text-sm italic text-primary-400/80">
                                {useCase.example}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </Container>
    );
};
