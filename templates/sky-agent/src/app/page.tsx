import { BentoSection } from "@/components/bento-section";
import { CompanySection } from "@/components/company-section";
import { CtaSection } from "@/components/cta-section";
import { FaqSection } from "@/components/faq-section";
import { FeaturesSection } from "@/components/features-section";
import { GrowthSection } from "@/components/growth-section";
import { HeroSection } from "@/components/hero-section";
import { PricingSection } from "@/components/pricing-section";
import { QuoteSection } from "@/components/quote-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TestimonialsSection } from "@/components/testimonials-section";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
        <HeroSection />
        <CompanySection />
        <BentoSection />
        <QuoteSection />
        <FeaturesSection />
        <GrowthSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
        <SiteFooter />
      </main>
    </>
  );
}
