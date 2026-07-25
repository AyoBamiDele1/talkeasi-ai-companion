// Landing page for TalkEasi (talkeasi.com / "/")
// Logged-in users are redirected to /home; everyone else sees the marketing page.

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import UseCases from "@/components/landing/UseCases";
import WhyNova from "@/components/landing/WhyNova";
import SafetySection from "@/components/landing/SafetySection";
import FAQ, { faqs } from "@/components/landing/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import FaqJsonLd from "@/components/landing/FaqJsonLd";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/home");
    }
  }, [user, loading, navigate]);

  const startTrial = () => navigate("/trial");
  const signIn = () => navigate("/auth");

  return (
    <div className="min-h-screen bg-background font-sans">
      <FaqJsonLd faqs={faqs} />
      <LandingNav onStartTrial={startTrial} onSignIn={signIn} />
      <main>
        <Hero onStartTrial={startTrial} onSignIn={signIn} />
        <HowItWorks />
        <UseCases />
        <WhyNova />
        <SafetySection />
        <FAQ />
        <FinalCTA onStartTrial={startTrial} />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Index;
