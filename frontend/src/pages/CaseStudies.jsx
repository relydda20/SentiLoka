import React from "react";
import Header from '../components/Sections/Header';
import CaseHeader from "../components/CaseStudies/CaseHeader";
import CaseAbout from "../components/CaseStudies/CaseAbout";
import CaseSection from "../components/CaseStudies/CaseSection";

const CaseStudies = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F5F8F7] to-white pt-24 pb-16">
      <Header />
      <CaseHeader />
      <CaseAbout />
      <CaseSection />
    </div>
  );
};

export default CaseStudies;