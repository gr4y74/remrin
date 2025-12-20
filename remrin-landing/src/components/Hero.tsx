"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/Container";
import heroImg from "../../public/img/hero.png";

export const Hero = () => {
  return (
    <>
      <Container className="flex flex-wrap pt-24 lg:pt-32">
        <motion.div
          className="flex items-center w-full lg:w-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="max-w-2xl mb-8">
            <h1 className="text-4xl font-medium leading-[1.1] tracking-tight lg:text-5xl xl:text-6xl text-white">
              Create an AI Companion
              <span className="text-primary-400 block mt-2">Who Actually Remembers You</span>
            </h1>
            <p className="py-6 text-lg leading-relaxed text-gray-300/90 lg:text-xl max-w-xl">
              Build a friend, tutor, or creative partner with memory, personality, and a voice.
              Unlike ChatGPT, your AI never forgets. From imagination to existence in 10 minutes.
            </p>

            <div className="flex flex-col items-start space-y-3 sm:space-x-4 sm:space-y-0 sm:items-center sm:flex-row">
              <a
                href="/forge/forge.html"
                className="px-8 py-4 text-lg font-medium text-center text-white bg-gradient-to-r from-primary-500 to-purple-600 rounded-full hover:from-primary-400 hover:to-purple-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-105 transform">
                Start Forging Your Soul (Free)
              </a>
              <a
                href="https://github.com/gr4y74/remrin"
                target="_blank"
                rel="noopener"
                className="flex items-center space-x-2 text-gray-400 hover:text-primary-400 transition-colors">
                <svg
                  role="img"
                  width="24"
                  height="24"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg">
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                <span>View on Github</span>
              </a>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex items-center justify-center w-full lg:w-1/2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="">
            <Image
              src={heroImg}
              width="616"
              height="617"
              className="object-cover drop-shadow-2xl"
              alt="AI Companion Illustration"
              loading="eager"
              placeholder="blur"
            />
          </div>
        </motion.div>
      </Container>

      <Container>
        <motion.div
          className="flex flex-col justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="text-lg text-center text-gray-400 font-light">
            Trusted by <span className="text-primary-400 font-medium">500+</span>{" "}
            early adopters worldwide
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-10 md:justify-around">
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-2xl">🎮</span>
              <span>Gamers</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-2xl">👨‍👩‍👧‍👦</span>
              <span>Parents</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-2xl">✏️</span>
              <span>Writers</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-2xl">🎓</span>
              <span>Students</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-2xl">🎭</span>
              <span>Roleplay Fans</span>
            </div>
          </div>
        </motion.div>
      </Container>
    </>
  );
}
