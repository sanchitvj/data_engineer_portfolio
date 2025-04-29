import React from 'react';
import ResumeSection from '../../components/resume/ResumeSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resume - Sanchit Vijay | Data Engineering',
  description: 'View Sanchit Vijay\'s professional resume highlighting data engineering experience, skills with AWS, Spark, Databricks, and Snowflake, and educational background.',
  keywords: ['Data Engineer Resume', 'AWS Experience', 'Spark', 'Databricks', 'Snowflake', 'Machine Learning Engineer', 'Sanchit Vijay Resume'],
  openGraph: {
    title: 'Resume - Sanchit Vijay | Data Engineering',
    description: 'Resume highlighting data engineering, machine learning, AI experience and career accomplishments',
    type: 'website',
    url: 'https://penguindb.me/resume',
    images: [
      {
        url: '/images/school_penguin.png',
        width: 1200,
        height: 630,
        alt: 'Sanchit Vijay - Resume',
      },
    ],
  }
};

export default function ResumePage() {
  return (
    <>
      <ResumeSection />
    </>
  );
} 