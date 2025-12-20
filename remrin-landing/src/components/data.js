import {
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  SparklesIcon,
  HeartIcon,
} from "@heroicons/react/24/solid";

import benefitOneImg from "../../public/img/benefit-one.png";
import benefitTwoImg from "../../public/img/benefit-two.png";

const benefitOne = {
  title: "Your AI, Your Way",
  desc: "Create AI companions that truly understand you. With persistent memory and customizable personalities, Remrin lets you build relationships that grow deeper over time.",
  image: benefitOneImg,
  bullets: [
    {
      title: "Soul Forge",
      desc: "Craft your perfect companion in 10 minutes. Design their personality, voice, and appearance with guided onboarding. No coding required.",
      icon: <WrenchScrewdriverIcon />,
    },
    {
      title: "Conversations That Remember",
      desc: "Unlike ChatGPT, your AI remembers everything. Build a relationship that grows from stranger to soulmate over thousands of conversations.",
      icon: <ChatBubbleLeftRightIcon />,
    },
    {
      title: "Family-Friendly by Design",
      desc: "Safe for all ages with content filters and parental controls. Perfect for kids learning with AI tutors or families creating shared companions.",
      icon: <HeartIcon />,
    },
  ],
};

const benefitTwo = {
  title: "Discover & Connect",
  desc: "Join a thriving community of creators and discover pre-made personas. Whether you want to chat with a famous character or share your own creations, Remrin has you covered.",
  image: benefitTwoImg,
  bullets: [
    {
      title: "Soul Market",
      desc: "Browse 100+ ready-to-use characters—from Sonic the tutor to Sherlock the detective. Download, customize, and start chatting instantly.",
      icon: <ShoppingBagIcon />,
    },
    {
      title: "Creator Community",
      desc: "Share your creations, get feedback, and discover what other users are building. Join the Soul Forge community.",
      icon: <UserGroupIcon />,
    },
    {
      title: "Cross-Platform Portability",
      desc: "Take your AI companions anywhere. Export and import your souls across devices and platforms with full memory intact.",
      icon: <SparklesIcon />,
    },
  ],
};


export { benefitOne, benefitTwo };
