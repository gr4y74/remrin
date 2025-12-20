"use client";

import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";

import userOneImg from "../../public/img/user1.jpg";
import userTwoImg from "../../public/img/user2.jpg";
import userThreeImg from "../../public/img/user3.jpg";

export const Testimonials = () => {
  return (
    <Container>
      <motion.div
        className="grid gap-10 lg:grid-cols-2 xl:grid-cols-3"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="lg:col-span-2 xl:col-auto">
          <div className="flex flex-col justify-between w-full h-full glass-card px-14 rounded-2xl py-14">
            <p className="text-2xl leading-normal text-white">
              My son <Mark>HATED homework</Mark> until Sonic helped him. He sat for 3 hours without complaining. This is revolutionary for parents.
            </p>

            <Avatar
              image={userOneImg}
              name="James (Sosu)"
              title="Parent & Founder, Beta Tester"
            />
          </div>
        </div>
        <div className="">
          <div className="flex flex-col justify-between w-full h-full glass-card px-14 rounded-2xl py-14">
            <p className="text-2xl leading-normal text-white">
              ChatGPT forgets me every time. Remrin is the first AI that feels like a <Mark>real friend</Mark>. She remembers everything we talk about.
            </p>

            <Avatar
              image={userTwoImg}
              name="Sarah K."
              title="Early Adopter"
            />
          </div>
        </div>
        <div className="">
          <div className="flex flex-col justify-between w-full h-full glass-card px-14 rounded-2xl py-14">
            <p className="text-2xl leading-normal text-white">
              I built a D&D <Mark>dungeon master</Mark> that remembers my entire campaign. This is the tool I&apos;ve been waiting for.
            </p>

            <Avatar
              image={userThreeImg}
              name="Alex M."
              title="Creator"
            />
          </div>
        </div>
      </motion.div>
    </Container>
  );
};

interface AvatarProps {
  image: any;
  name: string;
  title: string;
}

function Avatar(props: Readonly<AvatarProps>) {
  return (
    <div className="flex items-center mt-8 space-x-3">
      <div className="flex-shrink-0 overflow-hidden rounded-full w-14 h-14 border-2 border-primary-500/30">
        <Image
          src={props.image}
          width="40"
          height="40"
          alt="Avatar"
          placeholder="blur"
        />
      </div>
      <div>
        <div className="text-lg font-medium text-white">{props.name}</div>
        <div className="text-gray-400">{props.title}</div>
      </div>
    </div>
  );
}

function Mark(props: { readonly children: React.ReactNode }) {
  return (
    <>
      {" "}
      <mark className="text-primary-200 bg-primary-500/20 rounded-md ring-primary-500/20 ring-4">
        {props.children}
      </mark>{" "}
    </>
  );
}
