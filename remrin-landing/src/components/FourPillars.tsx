"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const pillars = [
    {
        icon: "🔨",
        title: "Soul Forge",
        description: "Create your perfect companion in minutes. Define personality, voice, and appearance.",
        href: "/forge/forge.html",
        color: "from-primary-500/20 to-purple-500/20",
        borderColor: "border-primary-500/30",
    },
    {
        icon: "💬",
        title: "Soul Chat",
        description: "Conversations that remember everything. Your companion grows with every message.",
        href: "/chat",
        color: "from-blue-500/20 to-cyan-500/20",
        borderColor: "border-blue-500/30",
    },
    {
        icon: "🏪",
        title: "Soul Market",
        description: "Browse ready-made personas. Find the perfect companion or share your creations.",
        href: "/market",
        color: "from-green-500/20 to-emerald-500/20",
        borderColor: "border-green-500/30",
    },
    {
        icon: "👥",
        title: "Community",
        description: "Join creators worldwide. Share tips, discover new personas, and connect.",
        href: "/community",
        color: "from-orange-500/20 to-amber-500/20",
        borderColor: "border-orange-500/30",
    },
];

export const FourPillars = () => {
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
                        Four Ways to Experience Remrin
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Create, chat, discover, and connect. The complete AI companion ecosystem.
                    </p>
                </motion.div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pillars.map((pillar, index) => (
                        <motion.a
                            key={pillar.title}
                            href={pillar.href}
                            className={`group relative p-6 rounded-2xl bg-gradient-to-br ${pillar.color} border ${pillar.borderColor} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            {/* Icon */}
                            <div className="text-4xl mb-4">{pillar.icon}</div>

                            {/* Title */}
                            <h3 className="text-xl font-medium text-white mb-2 group-hover:text-primary-400 transition-colors">
                                {pillar.title}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-400 leading-relaxed">
                                {pillar.description}
                            </p>

                            {/* Arrow indicator */}
                            <div className="absolute top-6 right-6 text-gray-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all">
                                →
                            </div>
                        </motion.a>
                    ))}
                </div>
            </div>
        </Container>
    );
};
