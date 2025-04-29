import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import MainLayout from '../components/layout/MainLayout';
import ServiceWorkerHandler from '@/components/ServiceWorkerHandler';

export const metadata: Metadata = {
  metadataBase: new URL('https://penguindb.me'),
  title: 'Sanchit Vijay - Data Engineer Portfolio',
  description: 'Explore the portfolio of Sanchit Vijay, a Data Analytics engineer specializing in building scalable pipelines, real-time analytics, and cloud data infrastructure solutions with expertise in AWS services.',
  keywords: ['penguindb', 'Data Engineer', 'AWS', 'Spark', 'Databricks', 'Snowflake', 'Open Source', 'Machine Learning', 'Portfolio', 'Sanchit Vijay', 'sanchitvj'],
  authors: [{ name: 'Sanchit Vijay' }],
  creator: 'Sanchit Vijay',
  publisher: 'Sanchit Vijay',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://penguindb.me',
    title: 'Sanchit Vijay - Data Engineer',
    description: 'Data Analytics Engineer specializing in building scalable pipelines, real-time analytics, and cloud data infrastructure solutions with expertise in AWS services.',
    siteName: 'Sanchit Vijay Portfolio',
    images: [
      {
        url: '/images/penguindb_main_logo.png',
        width: 1200,
        height: 630,
        alt: 'Sanchit Vijay - Data Engineer',
      },
    ],
  },
  // twitter: {
  //   card: 'summary_large_image',
  //   title: 'Sanchit Vijay - Data Engineer Portfolio',
  //   description: 'Expert Data Engineer specializing in AWS, Spark, and ML solutions',
  //   creator: '@sanchitvj', // Replace with your Twitter handle if applicable
  //   images: ['/images/penguindb_main_logo.png'], // Replace with your actual Twitter card image
  // },
  icons: {
    icon: [
      {
        url: '/images/penguindb_main_logo.png',
        sizes: '32x32',
      },
      {
        url: '/images/penguindb_main_logo.png',
        sizes: '48x48',
      },
      {
        url: '/images/penguindb_main_logo.png',
        sizes: '96x96',
      }
    ],
    apple: [
      {
        url: '/images/penguindb_main_logo.png',
        sizes: '180x180',
      }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta property="article:author" content="https://www.linkedin.com/in/sanchit-vijay" />
        <meta property="article:publisher" content="https://penguindb.me" />
      </head>
      <body 
        className="bg-gray-900 text-white antialiased"
        suppressHydrationWarning
      >
        <ServiceWorkerHandler />
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
