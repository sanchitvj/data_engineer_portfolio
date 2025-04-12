import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import MainLayout from '../components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Sanchit Vijay - Data Engineer',
  description: 'Portfolio website showcasing data engineering projects and expertise',
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
      </head>
      <body 
        className="bg-gray-900 text-white antialiased"
        suppressHydrationWarning
      >
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
