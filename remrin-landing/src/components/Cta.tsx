"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

export const Cta = () => {
  return (
    <Container className="py-16 lg:py-24">
      <motion.div
        className="relative overflow-hidden rounded-3xl px-8 py-12 lg:px-16 lg:py-20"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 25%, #a855f7 50%, #9333ea 75%, #7c3aed 100%)",
          backgroundSize: "400% 400%",
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 0.6,
          backgroundPosition: {
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          },
        }}
        viewport={{ once: true, margin: "-100px" }}
        whileHover={{
          scale: 1.01,
          boxShadow: "0 0 60px rgba(168, 85, 247, 0.5)"
        }}
      >
        {/* Animated glow border */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-400 via-purple-400 to-primary-400 opacity-50 blur-sm"
          style={{
            backgroundSize: "200% 200%",
            animation: "shimmer 3s linear infinite"
          }}
        />
        <div className="absolute inset-[2px] rounded-3xl bg-gradient-to-r from-primary-600 via-purple-600 to-primary-700" />

        {/* Animated floating orbs */}
        <motion.div
          className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 4s linear infinite",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Headline */}
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-tiempos font-medium tracking-tight text-white mb-4">
            Ready to meet your companion?
          </h2>

          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Create an AI that remembers everything. From imagination to existence
            in just 10 minutes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="/forge/forge.html"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-primary-600 bg-white rounded-full shadow-xl"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              Start Forging
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </motion.a>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-4 text-white/90 hover:text-white transition-colors"
            >
              View Pricing
            </a>
          </div>

          {/* Trust signal */}
          <p className="mt-8 text-sm text-white/60">
            Free tier available. No credit card required.
          </p>
        </div>
      </motion.div>
    </Container>
  );
};
