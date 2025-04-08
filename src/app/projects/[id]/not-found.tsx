'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';

export default function NotFound() {
  return (
    <MainLayout>
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8">
          The project you're looking for doesn't exist.
        </p>
        <Link
          href="/projects"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Back to Projects
        </Link>
      </div>
    </MainLayout>
  );
} 