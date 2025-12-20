"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

const pricingPlans = [
    {
        name: "Free",
        price: "0",
        period: "forever",
        description: "Perfect for trying out Remrin",
        features: [
            "1 AI Companion",
            "Basic memory (7-day)",
            "100 messages/day",
            "Community support",
            "Web access only",
        ],
        cta: "Start Free",
        ctaLink: "/forge/forge.html",
        highlight: false,
    },
    {
        name: "Soul Keeper",
        price: "9",
        period: "/month",
        description: "For dedicated companion creators",
        features: [
            "3 AI Companions",
            "Infinite memory",
            "Unlimited messages",
            "Voice conversations",
            "Priority support",
            "All AI models (GPT-4, Claude, Gemini)",
        ],
        cta: "Start Creating",
        ctaLink: "/forge/forge.html",
        highlight: true,
        popular: true,
    },
    {
        name: "Soul Forge Pro",
        price: "29",
        period: "/month",
        description: "For power users and creators",
        features: [
            "Unlimited Companions",
            "Infinite memory",
            "API access",
            "Custom integrations",
            "Real-time web search",
            "Commercial use license",
            "White-label options",
        ],
        cta: "Go Pro",
        ctaLink: "/forge/forge.html",
        highlight: false,
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
    },
};

export const Pricing = () => {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

    const getPrice = (basePrice: string) => {
        if (basePrice === "0") return "0";
        const price = parseInt(basePrice);
        return billingPeriod === "yearly" ? Math.floor(price * 0.8) : price;
    };

    return (
        <Container className="py-16 lg:py-24">
            {/* Header */}
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
            >
                <span className="text-4xl mb-4 block">💎</span>
                <h2 className="text-3xl lg:text-5xl font-tiempos font-medium tracking-tight text-white mb-4">
                    Choose Your Path
                </h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                    Start free, upgrade when you&apos;re ready. Cancel anytime.
                </p>

                {/* Billing Toggle */}
                <div className="mt-8 inline-flex items-center gap-4 p-1 rounded-full bg-white/5 border border-white/10">
                    <button
                        onClick={() => setBillingPeriod("monthly")}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === "monthly"
                            ? "bg-primary-500 text-white"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingPeriod("yearly")}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${billingPeriod === "yearly"
                            ? "bg-primary-500 text-white"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        Yearly
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            Save 20%
                        </span>
                    </button>
                </div>
            </motion.div>

            {/* Pricing Cards with Gradient Border Effect */}
            <div className="relative max-w-5xl mx-auto">
                {/* Gradient Background (Preline-style) */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_70%)]" />
                </div>

                <motion.div
                    className="grid gap-px md:grid-cols-3 rounded-2xl overflow-hidden"
                    style={{
                        background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(255,0,204,0.2), rgba(139,92,246,0.3))",
                    }}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={index}
                            className={`flex flex-col h-full text-center ${plan.highlight ? "md:-my-4 md:py-4" : ""
                                }`}
                            variants={cardVariants}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="bg-primary-500 text-white text-xs font-medium py-2 uppercase tracking-widest">
                                    Most Popular
                                </div>
                            )}

                            {/* Plan Name */}
                            <div className={`bg-[#0a0a15] pt-8 pb-4 px-6 ${!plan.popular ? "rounded-t-none" : ""}`}>
                                <h3 className="text-xl font-medium text-white">{plan.name}</h3>
                                <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="bg-[#0a0a15] py-6 px-6">
                                <div className="flex items-baseline justify-center">
                                    <span className="text-2xl font-medium text-gray-400">$</span>
                                    <span className="text-5xl font-medium text-white mx-1">
                                        {getPrice(plan.price)}
                                    </span>
                                    <span className="text-gray-400">{plan.period}</span>
                                </div>
                                {billingPeriod === "yearly" && plan.price !== "0" && (
                                    <p className="text-sm text-green-400 mt-2">
                                        Billed ${parseInt(plan.price) * 12 * 0.8}/year
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <div className="bg-[#0a0a15] flex-grow py-6 px-6">
                                <ul className="space-y-3 text-left">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li
                                            key={featureIndex}
                                            className="flex items-center gap-3 text-gray-300"
                                        >
                                            <svg
                                                className="w-5 h-5 text-primary-400 flex-shrink-0"
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
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA Button */}
                            <div className="bg-[#0a0a15] py-8 px-6">
                                <a
                                    href={plan.ctaLink}
                                    className={`block w-full py-3 px-6 rounded-full font-medium transition-all duration-300 ${plan.highlight
                                        ? "bg-gradient-to-r from-primary-500 to-purple-600 text-white hover:from-primary-400 hover:to-purple-500 shadow-lg hover:shadow-primary-500/30"
                                        : "border border-primary-500/50 text-primary-400 hover:bg-primary-500/10 hover:border-primary-400"
                                        }`}
                                >
                                    {plan.cta}
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Trust badges */}
            <motion.div
                className="mt-12 text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
            >
                <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Secure payments</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Cancel anytime</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>All major cards accepted</span>
                    </div>
                </div>
            </motion.div>
        </Container>
    );
};
