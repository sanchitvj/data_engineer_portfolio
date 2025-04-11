import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/about', label: 'About', icon: '👤' },
  { path: '/resume', label: 'Resume', icon: '📝' },
  { path: '/contact', label: 'Contact', icon: '📧' },
];

const PenguinNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-4">
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-data text-white'
                    : 'bg-dark-200/50 text-gray-400 hover:bg-dark-200/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default PenguinNav; 