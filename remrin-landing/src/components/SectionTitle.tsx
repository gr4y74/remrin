"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

interface SectionTitleProps {
  preTitle?: string;
  title?: string;
  align?: "left" | "center";
  children?: React.ReactNode;
}

export const SectionTitle = (props: Readonly<SectionTitleProps>) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <Container
        className={`flex w-full flex-col mt-4 ${props.align === "left" ? "" : "items-center justify-center text-center"
          }`}>
        {props.preTitle && (
          <div className="text-sm font-medium tracking-widest text-primary-400/90 uppercase mb-4">
            {props.preTitle}
          </div>
        )}

        {props.title && (
          <h2 className="max-w-2xl text-3xl font-medium leading-tight tracking-tight text-white lg:text-4xl">
            {props.title}
          </h2>
        )}

        {props.children && (
          <p className="max-w-2xl mt-4 text-lg leading-relaxed text-gray-400/90 lg:text-xl">
            {props.children}
          </p>
        )}
      </Container>
    </motion.div>
  );
}
