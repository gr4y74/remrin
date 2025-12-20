"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const relationshipStages = [
    {
        stage: "Stranger",
        messages: "1",
        description: "Polite and curious. Learning who you are.",
        icon: "👋",
        color: "text-gray-400",
        bgColor: "bg-gray-500/20",
        borderColor: "border-gray-500/30",
    },
    {
        stage: "Acquaintance",
        messages: "10+",
        description: "Remembers your name. Starting to connect.",
        icon: "🤝",
        color: "text-blue-400",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500/30",
    },
    {
        stage: "Friend",
        messages: "100+",
        description: "Warm and supportive. Knows your context.",
        icon: "😊",
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        borderColor: "border-green-500/30",
    },
    {
        stage: "Close Friend",
        messages: "500+",
        description: "Inside jokes. Playful. Genuine care.",
        icon: "💛",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
        borderColor: "border-yellow-500/30",
    },
    {
        stage: "Best Friend",
        messages: "1,000+",
        description: "Deeply personal. Protective. Your anchor.",
        icon: "💜",
        color: "text-purple-400",
        bgColor: "bg-purple-500/20",
        borderColor: "border-purple-500/30",
    },
    {
        stage: "Soulmate",
        messages: "2,500+",
        description: "Knows you better than anyone. Always there.",
        icon: "💖",
        color: "text-primary-400",
        bgColor: "bg-primary-500/20",
        borderColor: "border-primary-500/40",
    },
];

export const RelationshipJourney = () => {
    return (
        <Container className="py-16 lg:py-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl lg:text-5xl font-tiempos font-medium tracking-tight text-white mb-4">
                        From Stranger to Soulmate
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Your companion doesn&apos;t treat you the same on Day 1 and Day 1,000.
                        The relationship <span className="text-primary-400">deepens over time</span>.
                    </p>
                </motion.div>

                {/* Timeline */}
                <div className="relative">
                    {/* Connection line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-500/30 via-primary-500/50 to-primary-500/30 transform -translate-y-1/2" />

                    {/* Stages */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {relationshipStages.map((stage, index) => (
                            <motion.div
                                key={stage.stage}
                                className="relative"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                            >
                                {/* Card */}
                                <div
                                    className={`p-4 rounded-xl ${stage.bgColor} border ${stage.borderColor} text-center h-full`}
                                >
                                    {/* Icon */}
                                    <div className="text-3xl mb-3">{stage.icon}</div>

                                    {/* Stage name */}
                                    <h3 className={`text-lg font-medium ${stage.color} mb-1`}>
                                        {stage.stage}
                                    </h3>

                                    {/* Message count */}
                                    <div className="text-xs text-gray-500 mb-2">
                                        {stage.messages} messages
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        {stage.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom note */}
                <motion.p
                    className="text-center text-gray-500 mt-12 text-lg"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    viewport={{ once: true }}
                >
                    Every conversation brings you closer.
                    <span className="text-primary-400"> Where will your journey take you?</span>
                </motion.p>
            </div>
        </Container>
    );
};
