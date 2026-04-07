import React from 'react';
import NavBar from '@/components/sudodo/NavBar';
import CustomCursor from '@/components/sudodo/CustomCursor';
import HeroSection from '@/components/sudodo/HeroSection';
import Ticker from '@/components/sudodo/Ticker';
import StatsBar from '@/components/sudodo/StatsBar';
import AIWizard from '@/components/sudodo/AIWizard';
import FeaturesGrid from '@/components/sudodo/FeaturesGrid';
import DistroShowcase from '@/components/sudodo/DistroShowcase';
import CommunityFeed from '@/components/sudodo/CommunityFeed';
import Footer from '@/components/sudodo/Footer';

export default function SudodoLandingPage() {
  return (
    <>
      <CustomCursor />
      <NavBar />
      <HeroSection />
      <Ticker />
      <StatsBar />
      <AIWizard />
      <FeaturesGrid />
      <DistroShowcase />
      <CommunityFeed />
      <Footer />
    </>
  );
}
