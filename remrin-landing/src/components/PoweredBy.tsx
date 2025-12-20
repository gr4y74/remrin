"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const aiProviders = [
    {
        name: "OpenAI",
        model: "GPT-4",
        logo: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.6 8.3829l2.02-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.5056-2.6067-1.4998z" />
            </svg>
        ),
    },
    {
        name: "Anthropic",
        model: "Claude",
        logo: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M17.304 3.541l-5.357 16.918H8.532L13.871 3.54h3.433zm-10.608 0l5.357 16.918h3.415L10.129 3.54H6.696z" />
            </svg>
        ),
    },
    {
        name: "Google",
        model: "Gemini",
        logo: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M12 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 12 12 6.627 0 12-5.372 12-12S18.627 0 12 0zm5.93 7.93c.98.98.98 2.57 0 3.55l-5.93 5.93c-.98.98-2.57.98-3.55 0-.98-.98-.98-2.57 0-3.55l5.93-5.93c.98-.98 2.57-.98 3.55 0z" />
            </svg>
        ),
    },
    {
        name: "DeepSeek",
        model: "DeepSeek",
        logo: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
        ),
    },
];

const features = [
    { label: "Frontier Models", icon: "🧠" },
    { label: "Live Web Access", icon: "🌐" },
    { label: "Instant Upgrades", icon: "⚡" },
];

export const PoweredBy = () => {
    return (
        <Container className="py-16 lg:py-24">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <p className="text-xs font-medium tracking-widest text-primary-400 uppercase mb-4">
                        Powered By Giants
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-tiempos font-medium tracking-tight text-white mb-4">
                        We don&apos;t build the engine. We build the pilot.
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Your companion uses the world&apos;s most advanced AI—not a cheap knockoff—wrapped
                        in a personality layer that remembers, adapts, and grows.
                    </p>
                </motion.div>

                {/* Logo Strip */}
                <motion.div
                    className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    {aiProviders.map((provider, index) => (
                        <motion.div
                            key={provider.name}
                            className="flex flex-col items-center gap-2 text-gray-500 hover:text-white transition-colors duration-300 cursor-default"
                            whileHover={{ scale: 1.05 }}
                        >
                            {provider.logo}
                            <span className="text-xs font-medium tracking-wide">
                                {provider.model}
                            </span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Feature badges */}
                <motion.div
                    className="flex flex-wrap justify-center gap-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                >
                    {features.map((feature) => (
                        <div
                            key={feature.label}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300"
                        >
                            <span>{feature.icon}</span>
                            <span>{feature.label}</span>
                            <svg
                                className="w-4 h-4 text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                    ))}
                </motion.div>
            </div>
        </Container>
    );
};
