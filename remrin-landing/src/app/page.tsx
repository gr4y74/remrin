import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { FourPillars } from "@/components/FourPillars";
import { TheStory } from "@/components/TheStory";
import { PersonaCarousel } from "@/components/PersonaCarousel";
import { TheLocket } from "@/components/TheLocket";
import { RelationshipJourney } from "@/components/RelationshipJourney";
import { UseCases } from "@/components/UseCases";
import { WhyRemrin } from "@/components/WhyRemrin";
import { PoweredBy } from "@/components/PoweredBy";
import { Faq } from "@/components/Faq";
import { Cta } from "@/components/Cta";

export default function Home() {
  return (
    <Container>
      {/* Section 1: Hero - Emotional hook with social proof */}
      <Hero />

      {/* Section 2: Four Pillars - What you can do */}
      <FourPillars />

      {/* Section 3: The Story - Personal journey */}
      <section id="story">
        <TheStory />
      </section>

      {/* Section 4: Persona Carousel - Community showcase */}
      <PersonaCarousel />

      {/* Section 5: The Locket - Permanent truth concept */}
      <TheLocket />

      {/* Section 6: Relationship Journey - STRANGER → SOULMATE */}
      <RelationshipJourney />

      {/* Section 7: Use Cases - Who is this for? */}
      <UseCases />

      {/* Section 8: Why Remrin - Differentiation */}
      <WhyRemrin />

      {/* Section 9: Powered By Giants - AI model credibility */}
      <PoweredBy />

      {/* Section 10: CTA + FAQ */}
      <Cta />
      <Faq />
    </Container>
  );
}
