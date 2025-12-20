"use client";
import React from "react";
import { Container } from "@/components/Container";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/24/solid";

export const Faq = () => {
  return (
    <Container className="!p-0">
      <div className="w-full max-w-2xl p-2 mx-auto rounded-2xl">
        {faqdata.map((item, index) => (
          <div key={item.question} className="mb-5">
            <Disclosure>
              {({ open }) => (
                <>
                  <DisclosureButton className="flex items-center justify-between w-full px-4 py-4 text-lg text-left text-gray-800 rounded-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-primary-100 focus-visible:ring-opacity-75 dark:bg-trueGray-800 dark:text-gray-200">
                    <span>{item.question}</span>
                    <ChevronUpIcon
                      className={`${open ? "transform rotate-180" : ""
                        } w-5 h-5 text-primary`}
                    />
                  </DisclosureButton>
                  <DisclosurePanel className="px-4 pt-4 pb-2 text-gray-500 dark:text-gray-300">
                    {item.answer}
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
          </div>
        ))}
      </div>
    </Container>
  );
}

const faqdata = [
  {
    question: "Is Remrin free to use?",
    answer: "Yes! Remrin offers a free tier that lets you create and chat with AI companions. Premium features like advanced memory and voice customization are available with a subscription.",
  },
  {
    question: "How is Remrin different from ChatGPT?",
    answer: "Unlike ChatGPT, Remrin creates persistent AI companions with long-term memory. Your AI remembers every conversation, building a relationship that grows deeper over time. Plus, you can customize personality, appearance, and voice.",
  },
  {
    question: "Is Remrin safe for my kids?",
    answer: "Absolutely! Remrin is family-friendly by design with built-in content filters and parental controls. Many parents use Remrin to create educational tutors like 'Sonic the homework helper' for their children.",
  },
  {
    question: "Can I share my AI companions with others?",
    answer: "Yes! You can share your creations on the Soul Market for others to use. You can also keep them private or share only with friends and family.",
  },
  {
    question: "What happens to my data?",
    answer: "Your conversations and AI companions are stored securely and are never shared. You can export or delete your data at any time. We take privacy seriously.",
  },
];
