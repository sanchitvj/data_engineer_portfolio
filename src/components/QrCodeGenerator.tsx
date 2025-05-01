'use client';

import React, { useRef, useEffect, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';

export default function QrCodeGenerator() {
  const ref = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);

  useEffect(() => {
    // Clear any existing content to prevent duplicates in development due to Strict Mode
    if (ref.current) {
      ref.current.innerHTML = '';
    }

    // Initialize QR code in client side only
    const qrInstance = new QRCodeStyling({
      width: 300,
      height: 300,
      data: 'https://penguindb.me',
      margin: 10,
      backgroundOptions: {
        color: '#0f172a' // dark background
      },
      dotsOptions: {
        color: '#0ea5e9', // data palette
        type: 'rounded'
      },
      cornersSquareOptions: {
        // Outer shape of the eye
        type: 'extra-rounded',
        color: '#0ea5e9' // data palette color for the outer square
      },
      cornersDotOptions: {
        // Inner part of the eye - using the snowflake image
        type: 'image',
        image: '/images/snowflake.png'
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 5
      },
      image: '/images/penguindb_main_logo.png' // center logo
    });

    setQrCode(qrInstance);

    if (ref.current) {
      qrInstance.append(ref.current);
    }

    // Cleanup function to remove the QR code when component unmounts or re-renders
    return () => {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, []);

  const handleDownload = () => {
    if (qrCode) {
      qrCode.download('penguindb-qr-code', 'png');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div ref={ref} className="border-4 border-data p-2 rounded-lg mb-4" />
      <button 
        onClick={handleDownload} 
        className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-colors mt-4"
      >
        Download QR Code
      </button>
    </div>
  );
} 