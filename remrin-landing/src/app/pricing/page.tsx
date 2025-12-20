import { Container } from "@/components/Container";
import { Pricing } from "@/components/Pricing";
import { Cta } from "@/components/Cta";

export default function PricingPage() {
    return (
        <Container>
            <div className="pt-24 lg:pt-32">
                <Pricing />
                <Cta />
            </div>
        </Container>
    );
}
