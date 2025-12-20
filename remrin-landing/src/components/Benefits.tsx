"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

interface BenefitsProps {
  imgPos?: "left" | "right";
  data: {
    imgPos?: "left" | "right";
    title: string;
    desc: string;
    image: any;
    bullets: {
      title: string;
      desc: string;
      icon: React.ReactNode;
    }[];
  };
}

export const Benefits = (props: Readonly<BenefitsProps>) => {
  const { data } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <Container className="flex flex-wrap mb-20 lg:gap-10 lg:flex-nowrap">
        <div
          className={`flex items-center justify-center w-full lg:w-1/2 ${props.imgPos === "right" ? "lg:order-1" : ""
            }`}>
          <div>
            <Image
              src={data.image}
              width={521}
              height={521}
              alt="Benefits"
              className="object-cover drop-shadow-2xl"
              placeholder="blur"
              blurDataURL={data.image.src}
            />
          </div>
        </div>

        <div
          className={`flex flex-wrap items-center w-full lg:w-1/2 ${data.imgPos === "right" ? "lg:justify-end" : ""
            }`}>
          <div>
            <div className="flex flex-col w-full mt-4">
              <h3 className="max-w-2xl mt-3 text-3xl lg:text-4xl font-tiempos font-medium tracking-tight text-white">
                {data.title}
              </h3>

              <p className="max-w-2xl py-4 text-lg lg:text-xl text-gray-400 leading-relaxed">
                {data.desc}
              </p>
            </div>

            <div className="w-full mt-5">
              {data.bullets.map((item, index) => (
                <Benefit key={index} title={item.title} icon={item.icon}>
                  {item.desc}
                </Benefit>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </motion.div>
  );
};

function Benefit(props: any) {
  return (
    <div className="flex items-start mt-8 space-x-3">
      <div className="flex items-center justify-center flex-shrink-0 mt-1 bg-primary-500/20 border border-primary-500/30 rounded-md w-11 h-11">
        {React.cloneElement(props.icon, {
          className: "w-7 h-7 text-primary-400",
        })}
      </div>
      <div>
        <h4 className="text-xl font-medium text-white">
          {props.title}
        </h4>
        <p className="mt-1 text-gray-400">
          {props.children}
        </p>
      </div>
    </div>
  );
}
