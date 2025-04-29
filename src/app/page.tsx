import React from 'react';
import HeroSection from '../components/hero/HeroSection';
import AboutSection from '../components/about/AboutSection';
import TimelineSection from '@/components/journey/TimelineSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sanchit Vijay - Data Engineer',
  description: 'Welcome to Sanchit Vijay\'s portfolio. Expert Data engineer specializing in building scalable pipelines, real-time analytics, and cloud data infrastructure solutions with expertise in AWS services.',
  openGraph: {
    title: 'Sanchit Vijay - Data Engineer',
    description: 'Welcome to my professional portfolio showcasing data engineering and ML expertise',
    type: 'website',
    url: 'https://penguindb.me',
    images: [
      {
        url: '/images/penguindb_main_logo.png',
        width: 1200,
        height: 630,
        alt: 'Sanchit Vijay - Data Engineer',
      },
    ],
  }
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <TimelineSection />
    </>
  );
} 