import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import MainLayout from '../components/layout/MainLayout';
import ServiceWorkerHandler from '@/components/ServiceWorkerHandler';

export const metadata: Metadata = {
  metadataBase: new URL('https://penguindb.me'),
  title: 'Sanchit Vijay - Data Engineer',
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_io/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon_io/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      {
        rel: 'manifest',
        url: '/favicon_io/site.webmanifest'
      }
    ]
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <meta name="theme-color" content="#0f172a" />
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
