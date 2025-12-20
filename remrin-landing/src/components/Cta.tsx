"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

export const Cta = () => {
  return (
    <Container>
      <motion.div
        className="flex flex-wrap items-center justify-between w-full max-w-4xl gap-5 mx-auto text-white bg-gradient-to-r from-primary-600 to-purple-700 px-7 py-7 lg:px-12 lg:py-12 lg:flex-nowrap rounded-2xl shadow-2xl shadow-primary-500/20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="flex-grow text-center lg:text-left">
          <h2 className="text-2xl font-bold lg:text-3xl font-serif">
            Ready to Create Your AI Companion?
          </h2>
          <p className="mt-2 font-medium text-white/80 lg:text-xl">
            Join thousands of creators building meaningful connections with AI.
          </p>
        </div>
        <div className="flex-shrink-0 w-full text-center lg:w-auto">
          <a
            href="/forge/forge.html"
            className="inline-block py-3 mx-auto text-lg font-semibold text-center text-primary-600 bg-white rounded-full px-7 lg:px-10 lg:py-5 hover:bg-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-105 transform"
          >
            Start Forging (Free)
          </a>
        </div>
      </motion.div>
    </Container>
  );
};
