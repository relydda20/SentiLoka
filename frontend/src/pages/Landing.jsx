import React from 'react';
import Header from '../components/Sections/Header';
import HeroSection from '../components/Sections/HeroSection';
import FeaturesSection from '../components/Sections/FeaturesSection';
import HowItWorksSection from '../components/Sections/HowItWorksSection';
import StoriesSection from '../components/Sections/StoriesSection';
import PricingSection from '../components/Sections/PricingSection';
import OurTeamSection from '../components/Sections/OurTeamSection';
import CTASection from '../components/Sections/CTASection';

const Landing = () => {
  return (
    <>
      {/* Header tetap fixed */}
      <Header />

      {/* Scroll container utama - Responsif */}
      <main className="snap-y snap-mandatory h-screen overflow-y-scroll scroll-smooth">
        <section className="snap-start min-h-screen">
          <HeroSection />
        </section>

        <section className="snap-start min-h-screen">
          <FeaturesSection />
        </section>

        <section className="snap-start min-h-screen">
          <HowItWorksSection />
        </section>
        
        <section className="snap-start min-h-screen">
          <StoriesSection />
        </section>

        <section className="snap-start min-h-screen">
          <PricingSection />
        </section>

        <section className="snap-start min-h-screen">
          <OurTeamSection />
        </section>

        <section className="snap-start min-h-screen">
          <CTASection />
        </section>
      </main>
    </>
  );
};

export default Landing;