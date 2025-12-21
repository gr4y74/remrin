"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const differentiators = [
    {
        icon: "🧠",
        highlight: "Unlike ChatGPT",
        message: "Remrin never forgets",
        description: "Every conversation builds on the last. Your companion remembers your name, your preferences, and your history.",
    },
    {
        icon: "💖",
        highlight: "Unlike Character.AI",
        message: "Remrin grows with you",
        description: "The relationship deepens over time. From Stranger to Soulmate, your companion evolves as you do.",
    },
    {
        icon: "🌐",
        highlight: "Unlike others",
        message: "Your companion is portable",
        description: "Take your AI companion across platforms. Your memories and relationship go wherever you go.",
    },
];

export const WhyRemrin = () => {
    return (
        <Container className="py-16 lg:py-24">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl lg:text-4xl font-tiempos font-medium tracking-tight text-white mb-4">
                        Why Remrin?
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        What makes us different from everything else.
                    </p>
                </motion.div>

                {/* Differentiators */}
                <div className="space-y-6">
                    {differentiators.map((item, index) => (
                        <motion.div
                            key={index}
                            className="flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            whileHover={{
                                scale: 1.02,
                                y: -3,
                                boxShadow: "0 8px 30px rgba(168, 85, 247, 0.25)"
                            }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            {/* Icon */}
                            <div className="text-3xl flex-shrink-0">{item.icon}</div>

                            {/* Content */}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-gray-500 text-sm">{item.highlight},</span>
                                    <span className="text-primary-400 font-medium">{item.message}</span>
                                </div>
                                <p className="text-gray-400 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>

                            {/* Checkmark */}
                            <div className="text-green-400 text-xl flex-shrink-0 ml-auto">✓</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </Container>
    );
};
