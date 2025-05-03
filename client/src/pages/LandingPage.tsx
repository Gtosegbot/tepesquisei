import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import AIResearch from "@/components/AIResearch";
import HowItWorks from "@/components/HowItWorks";
import AIDetails from "@/components/AIDetails";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { useState } from "react";
import LoginModal from "@/components/LoginModal";

const LandingPage = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-opensans text-gray-800">
      <Header onLoginClick={() => setIsLoginModalOpen(true)} />
      <Hero />
      <Features />
      <AIResearch />
      <HowItWorks />
      <AIDetails />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};

export default LandingPage;
