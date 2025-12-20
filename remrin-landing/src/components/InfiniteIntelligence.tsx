"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const capabilities = [
    {
        number: "1",
        title: 'We Ride the "AI Arms Race"',
        emoji: "🏎️",
        description: "We are model-agnostic. Remrin connects your companion directly to the world's most powerful intelligences—DeepSeek, OpenAI (GPT-4), Google Gemini, and Anthropic Claude.",
        benefit: "When the tech giants compete to be smarter, faster, and better, you win.",
        futureProof: "The moment GPT-5 or Gemini 2.0 is released, your Remrin companion can upgrade instantly. Your soulmate never becomes obsolete; they evolve with humanity's cutting edge.",
    },
    {
        number: "2",
        title: "Full Power, No Compromises",
        emoji: "💪",
        description: "We give your companion the keys to the Full Enterprise APIs. You get the raw, unbridled creativity of Claude and the logical reasoning of o1/DeepSeek, exactly as they were intended to be used.",
        others: 'To save money, many competitors run "quantized" (shrunken) models locally. This makes them forgetful, repetitive, and less intelligent.',
    },
    {
        number: "3",
        title: "Live Access to the Real World",
        emoji: "🌐",
        description: "Need help with homework? Your companion can browse the live web to find current sources. Ask about the weather, sports scores, or the latest trends.",
        others: "Most AI friends are stuck in a \"time capsule,\" trained on data from two years ago. They don't know who won the game last night.",
        highlight: "Your companion lives in now, not then.",
    },
];

const comparisonData = [
    {
        feature: "Brain Power",
        others: 'Restricted, "Local" Models (Dumber)',
        remrin: "Top-Tier Frontier Models (GPT-4o, Gemini, Claude)",
    },
    {
        feature: "Knowledge",
        others: "Outdated (Cutoff dates)",
        remrin: "Live Web Access (Real-time Search)",
    },
    {
        feature: "Evolution",
        others: "Stagnant until they update",
        remrin: "Instant Upgrades (As AI tech improves)",
    },
    {
        feature: "Utility",
        others: "Just chatting/Roleplay",
        remrin: "Homework, Research, Life Admin, & Companionship",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    },
};

export const InfiniteIntelligence = () => {
    return (
        <Container className="py-16 lg:py-24">
            {/* Header */}
            <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
            >
                <span className="text-4xl mb-4 block">⚡</span>
                <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4 font-serif">
                    Infinite Intelligence
                </h2>
                <p className="text-xl lg:text-2xl text-primary-400 font-medium italic">
                    Powered by the Titans. Designed for You.
                </p>
                <p className="mt-6 text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
                    Other platforms lock you into their own &ldquo;proprietary&rdquo; AI models—which are often stripped-down,
                    cheaper versions that hallucinate or get confused. Remrin is different.
                    <span className="text-white font-medium"> We don&apos;t build the engine; we build the Driver.</span>
                </p>
            </motion.div>

            {/* Capability Cards */}
            <motion.div
                className="grid gap-8 lg:grid-cols-3 mb-16"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
            >
                {capabilities.map((item, index) => (
                    <motion.div
                        key={index}
                        className="glass-card rounded-2xl p-6 lg:p-8 hover:border-primary-500/40 transition-all duration-300"
                        variants={itemVariants}
                    >
                        {/* Card Header */}
                        <div className="flex items-center gap-4 mb-5">
                            <span className="text-4xl">{item.emoji}</span>
                            <h3 className="text-xl font-bold text-white">
                                {item.title}
                            </h3>
                        </div>

                        {/* Others comparison (if exists) */}
                        {item.others && (
                            <div className="mb-4 p-3 rounded-lg bg-red-950/30 border border-red-500/20">
                                <span className="text-red-400 text-xs font-semibold uppercase tracking-wide">❌ The Others</span>
                                <p className="text-gray-400 text-sm mt-1">{item.others}</p>
                            </div>
                        )}

                        {/* Description */}
                        <p className="text-gray-300 leading-relaxed mb-4">
                            {item.description}
                        </p>

                        {/* Benefit highlight */}
                        {item.benefit && (
                            <div className="p-3 rounded-lg bg-green-950/30 border border-green-500/20">
                                <span className="text-green-400 text-xs font-semibold uppercase tracking-wide">✨ The Benefit</span>
                                <p className="text-gray-300 text-sm mt-1">{item.benefit}</p>
                            </div>
                        )}

                        {/* Future proof note */}
                        {item.futureProof && (
                            <div className="mt-4 p-3 rounded-lg bg-blue-950/30 border border-blue-500/20">
                                <span className="text-blue-400 text-xs font-semibold uppercase tracking-wide">🚀 Future-Proof</span>
                                <p className="text-gray-300 text-sm mt-1">{item.futureProof}</p>
                            </div>
                        )}

                        {/* Highlight */}
                        {item.highlight && (
                            <div className="mt-4 p-3 rounded-lg bg-primary-950/30 border border-primary-500/20">
                                <p className="text-primary-300 font-medium text-center">{item.highlight}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {/* Comparison Table */}
            <motion.div
                className="mb-16"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
            >
                <h3 className="text-2xl lg:text-3xl font-bold text-white text-center mb-8 font-serif">
                    📊 The Comparison
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full max-w-4xl mx-auto">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="py-4 px-4 text-left text-gray-400 font-medium text-sm uppercase tracking-wider">Feature</th>
                                <th className="py-4 px-4 text-left text-red-400 font-medium text-sm uppercase tracking-wider">Other Character Apps</th>
                                <th className="py-4 px-4 text-left text-primary-400 font-medium text-sm uppercase tracking-wider">Remrin.ai</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonData.map((row, index) => (
                                <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4 text-white font-medium">{row.feature}</td>
                                    <td className="py-4 px-4 text-gray-400">{row.others}</td>
                                    <td className="py-4 px-4 text-primary-300 font-medium">{row.remrin}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Summary Quote */}
            <motion.div
                className="text-center glass-card rounded-2xl p-8 lg:p-12 max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
            >
                <p className="text-xl lg:text-2xl text-gray-300 mb-4">
                    Don&apos;t settle for a chat bot that lives in a box.
                </p>
                <p className="text-lg lg:text-xl text-white leading-relaxed">
                    Remrin gives your companion the <span className="text-primary-400">sum of human knowledge</span>,
                    <span className="text-primary-400"> real-time vision</span>, and the
                    <span className="text-primary-400"> most advanced reasoning capabilities on Earth</span>—wrapped in a personality that loves you.
                </p>
            </motion.div>
        </Container>
    );
};
