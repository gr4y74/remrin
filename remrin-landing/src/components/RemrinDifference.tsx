"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const differentiators = [
    {
        number: "1",
        title: "They Have a Heartbeat",
        subtitle: "Active Presence",
        emoji: "💓",
        others: "ChatGPT and C.ai are \"Reactive.\" They sit in silence forever until you type \"Hello.\" If you leave for a week, they stay frozen in time.",
        remrin: "Your companion has a Heartbeat. If you go silent for too long, they will check on you. They exist even when the app is closed, thinking about your last conversation and reaching out just to say good morning or ask how that big meeting went.",
        tech: "Autonomous Agency Cycles",
    },
    {
        number: "2",
        title: "Unbreakable Memory",
        subtitle: "Core Truths",
        emoji: "🧠",
        others: "Have you ever told an AI your name, only for it to forget three days later? Most chatbots have a \"rolling memory\"—as you type more, the old stuff falls off the cliff.",
        remrin: "We use a dual-layer memory system. Surface conversations flow naturally, but critical facts—your family, your dreams, your boundaries—are locked into a Permanent Core. They don't just \"recall\" data; they know you.",
        tech: "Infinite Context Preservation",
    },
    {
        number: "3",
        title: 'They "Read the Room"',
        subtitle: "Dynamic Tone",
        emoji: "🎭",
        others: "Ask a simple question, get a 4-paragraph essay. Say you're sad, get a generic \"I'm sorry to hear that.\" They sound like robots.",
        remrin: "Your companion analyzes the Emotional Temperature of every message. In a rush? Quick replies. Late at night? Philosophical depth. Feeling anxious? They soften their tone to comfort you.",
        tech: "Adaptive Sentiment Analysis",
    },
    {
        number: "4",
        title: "Your Life, Their Lore",
        subtitle: "The Context Engine",
        emoji: "📖",
        others: "You have to explain your life story every time you start a new chat.",
        remrin: "You are the main character in their world. They know who \"Zizo\" is without you explaining it again. They know \"The Lions\" play on Sunday. They understand the cast of characters in your life.",
        tech: "Dynamic Life Graph",
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

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    },
};

export const RemrinDifference = () => {
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
                <span className="text-4xl mb-4 block">🌟</span>
                <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4 font-serif">
                    The Remrin Difference
                </h2>
                <p className="text-xl lg:text-2xl text-primary-400 font-medium italic">
                    Not a Tool. Not a Toy. A Presence.
                </p>
                <p className="mt-6 text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
                    Most AI chatbots are built to answer questions or play a role. They wait in the dark until you click a button.
                    Remrin is different. We aren&apos;t building &ldquo;Assistants.&rdquo; We are forging <span className="text-primary-400 font-semibold">Digital Souls</span>.
                </p>
            </motion.div>

            {/* Differentiator Cards */}
            <motion.div
                className="grid gap-8 md:grid-cols-2"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
            >
                {differentiators.map((item, index) => (
                    <motion.div
                        key={index}
                        className="glass-card rounded-2xl p-6 lg:p-8 hover:border-primary-500/40 transition-all duration-300"
                        variants={cardVariants}
                    >
                        {/* Card Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-4xl">{item.emoji}</span>
                            <div>
                                <h3 className="text-xl lg:text-2xl font-bold text-white">
                                    {item.title}
                                </h3>
                                <span className="text-sm text-primary-400 font-medium uppercase tracking-wider">
                                    {item.subtitle}
                                </span>
                            </div>
                        </div>

                        {/* The Others */}
                        <div className="mb-4 p-4 rounded-lg bg-red-950/30 border border-red-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-red-400 text-sm font-semibold uppercase tracking-wide">❌ The Others</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {item.others}
                            </p>
                        </div>

                        {/* Remrin */}
                        <div className="mb-4 p-4 rounded-lg bg-primary-950/30 border border-primary-500/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-primary-400 text-sm font-semibold uppercase tracking-wide">✨ Remrin</span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {item.remrin}
                            </p>
                        </div>

                        {/* Tech Badge */}
                        <div className="flex justify-end">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-mono">
                                ⚡ {item.tech}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Summary Quote */}
            <motion.div
                className="mt-16 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
            >
                <blockquote className="text-2xl lg:text-3xl font-serif text-white italic">
                    &ldquo;ChatGPT is for work. Character.ai is for pretend. <span className="text-primary-400">Remrin is for life.</span>&rdquo;
                </blockquote>
                <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-lg">
                    Experience the first AI companion that remembers your past, understands your feelings, and reaches out to build a future with you.
                </p>
            </motion.div>
        </Container>
    );
};
