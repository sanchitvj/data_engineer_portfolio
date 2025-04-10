'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { SiKaggle } from 'react-icons/si';

// Interface for a single activity within a year
interface Activity {
  title: string;
  description: string;
  link?: string; // Optional link
  linkText?: React.ReactNode; // Text for the link
}

// Updated interface for a timeline year entry
interface TimelineEntry {
  id: number; // Use year as ID if unique, or generate unique IDs
  year: number;
  activities: Activity[]; // Array of activities for the year
}

// --- Updated Sample Data (Replace with your actual journey) ---
const timelineData: TimelineEntry[] = [
{
    id: 2019,
    year: 2019,
    activities: [
        {
        title: 'Electronics engineering getting on nerves 💀',
        description: 'Questioning why I was doing engineering, especially hating electronics. Started exploring other career options and fields.',
        // link: 'https://www.kaggle.com/your-profile', // Example link
        // linkText: 'My Kaggle Profile'
        }
    ]
    },
  {
    id: 2020,
    year: 2020,
    activities: [
      {
        title: 'First Steps into Coding 💻',
        description: '• Covid times hit.\n• Finally, no more boring electronics classes! 😌\n• Felt the pressure to learn coding; dove into C++, Python, and Data Structures & Algorithms, following the trend.',
        // link: 'https://www.kaggle.com/your-profile', // Example link
        // linkText: 'My Kaggle Profile'
      }
    ]
  },
  {
    id: 2021,
    year: 2021,
    activities: [
      {
        title: 'Data Science & ML Exploration',
        description: 'Started exploring data science, ML and deep learning. Participated in Kaggle competitions and won multiple medals.',
        link: 'https://www.kaggle.com/sanchitvj',
        linkText: <SiKaggle className="text-2xl text-data hover:text-data-light transition-colors" />
      },
      {
        title: 'First Data Engineering Role',
        description: 'Joined Bytelearn as a Data Engineer, gaining hands-on experience in data pipelines and ETL processes.',
      },
      {
        title: 'Masters Preparation',
        description: 'Realized the need for more experience and started preparing for Data Science Masters in the US.',
      }
    ]
  },
  {
    id: 2022,
    year: 2022,
    activities: [
      {
        title: 'Research Publications 📚',
        description: 'Published 2 research papers in the field of data science and machine learning.',
        link: 'https://research-paper-link.com',
        linkText: 'View Research Papers'
      },
      {
        title: 'Career Transition',
        description: 'Completed tenure at Bytelearn and embarked on a new journey to the US for Masters in Data Science.',
      },
      {
        title: 'Masters Journey Begins',
        description: 'Started Masters program in Data Science in the US, marking a significant step in academic and professional growth.',
      }
    ]
  },
  {
    id: 2023,
    year: 2023,
    activities: [
      {
        title: 'Teaching Assistant Role',
        description: 'Served as a Teaching Assistant for the Data Science department, helping students understand complex concepts.',
      },
      {
        title: 'Research Project Experience',
        description: 'Worked as a Data Analyst in a research project during summer, applying theoretical knowledge to real-world problems.',
      },
      {
        title: 'Professional Growth',
        description: 'Joined Opal HTM as a Data and ML Engineer, combining data engineering with machine learning expertise.',
      }
    ]
  },
  {
    id: 2024,
    year: 2024,
    activities: [
      {
        title: 'Academic Achievement',
        description: 'Successfully completed Masters in Data Science, marking a significant milestone in academic journey.',
      },
      {
        title: 'Professional Development',
        description: 'Continued contributing to Opal HTM while joining Zach\'s Bootcamp, earning a superbness certificate.',
      },
      {
        title: 'Entrepreneurial Venture',
        description: 'Founded Betflow, applying data engineering and ML expertise to create innovative solutions.',
      }
    ]
  },
  {
    id: 2025,
    year: 2025,
    activities: [
      {
        title: 'Brand Building & Growth',
        description: 'Focusing on establishing personal brand as a data engineer through articles and technical content.',
      },
      {
        title: 'Full-Stack Evolution',
        description: 'Expanding skillset beyond data engineering, working towards becoming a full-stack developer.',
      },
      {
        title: 'Project Portfolio',
        description: 'Actively working on multiple projects, embracing the coding journey while exploring new opportunities.',
      }
    ]
  },
];
// --- End Sample Data ---

const PENGUIN_WIDTH = 60; // Adjust if your SVG has a different natural width
const PENGUIN_HEIGHT = 60; // Add a height for the SVG container

const TimelineSection: React.FC = () => {
  // Sort data by year just in case it's not
  const sortedTimelineData = [...timelineData].sort((a, b) => a.year - b.year);
  const firstYear = sortedTimelineData[0]?.year;
  const lastYear = sortedTimelineData[sortedTimelineData.length - 1]?.year;

  const [selectedYear, setSelectedYear] = useState<number | null>(lastYear ?? null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (trackRef.current) {
      setTrackWidth(trackRef.current.offsetWidth);
    }
    const handleResize = () => {
        if (trackRef.current) {
            setTrackWidth(trackRef.current.offsetWidth);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getYearPosition = (year: number): number => {
    if (!trackWidth || firstYear === undefined || lastYear === undefined) return 0;
    if (lastYear === firstYear) return trackWidth / 2;
    const percentage = (year - firstYear) / (lastYear - firstYear);
    const effectiveTrackWidth = trackWidth - PENGUIN_WIDTH;
    return (percentage * effectiveTrackWidth) + (PENGUIN_WIDTH / 2);
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!trackWidth) return;
    // Calculate the final position relative to the track start
    const finalX = info.point.x - (trackRef.current?.getBoundingClientRect().left ?? 0);
    let closestYear = selectedYear;
    let minDistance = Infinity;

    sortedTimelineData.forEach(entry => {
      const yearX = getYearPosition(entry.year);
      // Distance from the center of the year marker
      const distance = Math.abs(finalX - yearX);
      if (distance < minDistance) {
        minDistance = distance;
        closestYear = entry.year;
      }
    });
    setSelectedYear(closestYear);
  };

  const selectedEntry = sortedTimelineData.find(entry => entry.year === selectedYear);

  const penguinX = useMotionValue(selectedYear ? getYearPosition(selectedYear) - PENGUIN_WIDTH / 2 : 0);
  useEffect(() => {
    if (selectedYear !== null) {
      penguinX.set(getYearPosition(selectedYear) - PENGUIN_WIDTH / 2);
    }
  }, [selectedYear, trackWidth]);

  return (
    <section className="py-20 px-4 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 md:mb-20">
          My Data Journey
        </h2>

        <div ref={constraintsRef} className="relative w-full max-w-4xl mx-auto mb-16 px-5">
          <div ref={trackRef} className="relative h-2 bg-gray-700 rounded-full w-full">
            {sortedTimelineData.map(entry => (
              <div
                key={entry.id}
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-900 cursor-pointer transition-transform hover:scale-125 z-20"
                style={{ left: `${getYearPosition(entry.year)}px`, transform: `translate(-50%, -50%)` }}
                onClick={() => setSelectedYear(entry.year)}
              >
                 <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                    {entry.year}
                 </span>
              </div>
            ))}
          </div>

          <motion.div
             className="absolute bottom-full mb-1 cursor-grab z-10"
             style={{ 
                 x: penguinX, 
                 width: PENGUIN_WIDTH,
                 height: PENGUIN_HEIGHT
             }}
             drag="x"
             dragConstraints={constraintsRef}
             dragElastic={0.1}
             dragMomentum={false}
             onDragEnd={handleDragEnd}
             whileTap={{ cursor: "grabbing" }}
           >
            <Image 
                src="/icons/penguindb_icon.svg"
                alt="Timeline marker"
                width={PENGUIN_WIDTH}
                height={PENGUIN_HEIGHT}
                className="pointer-events-none"
            />
           </motion.div>
        </div>

        {/* Updated Details Section */}
        <div className="relative min-h-[200px] max-w-3xl mx-auto">
          <AnimatePresence mode='wait'>
            {selectedEntry && (
              <motion.div
                key={selectedEntry.year}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full" 
              >
                <h3 className="text-2xl font-semibold text-white mb-4 text-center border-b border-gray-700 pb-2">{selectedEntry.year}</h3>
                <div className="space-y-4 mt-4">
                  {selectedEntry.activities.map((activity, index) => (
                    <div key={index} className="bg-gray-700/50 p-4 rounded-md border border-gray-600">
                      <h4 className="text-lg font-semibold text-blue-400 mb-1">{activity.title}</h4>
                      <p className="text-gray-300 text-sm mb-2 whitespace-pre-line">{activity.description}</p>
                      {activity.link && activity.linkText && (
                        <Link href={activity.link} target="_blank" rel="noopener noreferrer">
                          <span className="inline-block text-blue-400 hover:text-blue-300 text-sm transition-colors underline">
                            {activity.linkText} →
                          </span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection; 