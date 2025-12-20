"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

export const Cta = () => {
  return (
    <Container className="py-16 lg:py-24">
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-purple-600 to-primary-700 px-8 py-12 lg:px-16 lg:py-20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
        </div>

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
            <a
              href="/forge/forge.html"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-medium text-primary-600 bg-white rounded-full hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform"
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
            </a>
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
