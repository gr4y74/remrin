import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { Benefits } from "@/components/Benefits";
import { RemrinDifference } from "@/components/RemrinDifference";
import { InfiniteIntelligence } from "@/components/InfiniteIntelligence";
import { Video } from "@/components/Video";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { Cta } from "@/components/Cta";

import { benefitOne, benefitTwo } from "@/components/data";
export default function Home() {
  return (
    <Container>
      <Hero />
      <SectionTitle
        preTitle="Why Remrin?"
        title="AI Companions That Actually Remember You"
      >
        Unlike ChatGPT or Character.AI, Remrin creates persistent AI companions
        with memory, personality, and voice. Build relationships that grow deeper
        over time—from imagination to existence in just 10 minutes.
      </SectionTitle>

      <RemrinDifference />

      <Benefits data={benefitOne} />
      <Benefits imgPos="right" data={benefitTwo} />

      <InfiniteIntelligence />

      <SectionTitle
        preTitle="See It In Action"
        title="Watch How Soul Forge Works"
      >
        Create your first AI companion in under 10 minutes. Our guided onboarding
        walks you through personality design, voice selection, and memory setup.
      </SectionTitle>

      <Video videoId="fZ0D0cnR88E" />

      <SectionTitle
        preTitle="Community Love"
        title="What Our Creators Are Saying"
      >
        Join thousands of users who are building meaningful connections with AI
        companions that actually remember them.
      </SectionTitle>

      <Testimonials />

      <Pricing />

      <SectionTitle preTitle="FAQ" title="Got Questions? We've Got Answers">
        Everything you need to know about creating and using AI companions on Remrin.
      </SectionTitle>

      <Faq />
      <Cta />
    </Container>
  );
}
