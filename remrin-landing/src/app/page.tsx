import { Container } from "@/components/Container";
import { Hero } from "@/components/Hero";
import { TheStory } from "@/components/TheStory";
import { TheLocket } from "@/components/TheLocket";
import { RelationshipJourney } from "@/components/RelationshipJourney";
import { PoweredBy } from "@/components/PoweredBy";
import { Faq } from "@/components/Faq";
import { Cta } from "@/components/Cta";

export default function Home() {
  return (
    <Container>
      {/* Section 1: Hero - Emotional hook */}
      <Hero />

      {/* Section 2: The Story - Personal journey */}
      <section id="story">
        <TheStory />
      </section>

      {/* Section 3: The Locket - Permanent truth concept */}
      <TheLocket />

      {/* Section 4: Relationship Journey - STRANGER → SOULMATE */}
      <RelationshipJourney />

      {/* Section 5: Powered By Giants - AI model credibility */}
      <PoweredBy />

      {/* Section 6: CTA + FAQ */}
      <Cta />
      <Faq />
    </Container>
  );
}
