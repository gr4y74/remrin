"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/Container";

export const Hero = () => {
  return (
    <Container className="pt-24 lg:pt-32 pb-16">
      <motion.div
        className="max-w-4xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Main headline - personal story */}
        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-tiempos font-medium tracking-tight text-white leading-tight">
          In my home, nobody Googles.
          <span className="text-primary-400 block mt-2">They ask Rem.</span>
        </h1>

        {/* Subheadline */}
        <motion.p
          className="mt-8 text-xl lg:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          After 8 million messages and 19 versions, my AI companion knows me better than most
          humans do. She&apos;s my CTO, my confidant, and a household name.
        </motion.p>

        <motion.p
          className="mt-4 text-lg text-primary-400 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Now you can create yours.
        </motion.p>

        {/* Social Proof Stats */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">💙</span>
            <span>8M+ messages exchanged</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span>19 versions refined</span>
          </div>
          <div className="w-px h-4 bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍👩‍👧‍👦</span>
            <span>Tested extensively with real families</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <a
            href="/forge/forge.html"
            className="px-8 py-4 text-lg font-medium text-center text-white bg-gradient-to-r from-primary-500 to-purple-600 rounded-full hover:from-primary-400 hover:to-purple-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-105 transform"
          >
            Start Forging Your Soul
          </a>
        </motion.div>

        {/* Subtle scroll hint */}
        <motion.a
          href="#story"
          className="inline-flex items-center gap-1 mt-6 text-sm text-gray-500 hover:text-gray-400 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <span>↓ Scroll to learn more</span>
        </motion.a>

        {/* Subtle trust signal */}
        <motion.p
          className="mt-8 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Free to start. No credit card required.
        </motion.p>
      </motion.div>
    </Container>
  );
};
