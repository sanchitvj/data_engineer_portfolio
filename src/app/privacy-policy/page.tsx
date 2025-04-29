import { Metadata } from 'next';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Privacy Policy | Sanchit Vijay Portfolio',
  description: 'Privacy policy for Sanchit Vijay\'s personal website and data engineering portfolio.',
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy | Sanchit Vijay Portfolio',
    description: 'Privacy policy information for Sanchit Vijay\'s personal website',
  }
};

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 mb-6">
                This is a personal portfolio website. We do not collect any data from users.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Contact</h2>
              <p className="text-gray-600">
                If you have any questions, please contact us at: <a href="mailto:sanchit.aiwork@gmail.com" className="text-blue-600 hover:text-blue-800">contact@sanchitVijay.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 