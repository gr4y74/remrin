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
          <div className="text-sm font-bold tracking-wider text-primary-400 uppercase">
            {props.preTitle}
          </div>
        )}

        {props.title && (
          <h2 className="max-w-2xl mt-3 text-3xl font-bold leading-snug tracking-tight text-white lg:leading-tight lg:text-4xl font-serif">
            {props.title}
          </h2>
        )}

        {props.children && (
          <p className="max-w-2xl py-4 text-lg leading-normal text-gray-400 lg:text-xl xl:text-xl">
            {props.children}
          </p>
        )}
      </Container>
    </motion.div>
  );
}
