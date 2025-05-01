import React from 'react';
import QrCodeGenerator from '@/components/QrCodeGenerator';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PenguinDB QR Code',
  description: 'Scan this QR code to visit Sanchit Vijay\'s data engineering portfolio website',
};

export default function QRPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Scan to Visit My Portfolio</h1>
        <p className="text-gray-400 mb-8">Use your phone camera to scan this QR code and visit penguindb.me</p>
        
        <div className="bg-dark-200 p-6 rounded-xl shadow-lg">
          <QrCodeGenerator />
        </div>
      </div>
    </div>
  );
} 