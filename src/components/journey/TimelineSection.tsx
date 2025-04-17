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
  links?: Array<{
    url: string;
    text: string | React.ReactNode;
  }>;
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
        links: [{
          url: 'https://www.kaggle.com/sanchitvj',
          text: 'Kaggle'
        }]
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
        title: 'Research Publications',
        description: 'Published two significant research papers in healthcare and natural language processing:\n• "MRI brain tumor segmentation using residual Spatial Pyramid Pooling-powered 3D U-Net" in Frontiers in Public Health\n• "A Novel Approach for Tamil Text Classification using Deep Learning" at DravidianLangTech 2022',
        links: [
          {
            url: 'https://scholar.google.com/citations?user=1rsn3wsAAAAJ&hl=en&authuser=2',
            text: 'Google Scholar'
          },
        //   {
        //     url: 'https://aclanthology.org/2022.dravidianlangtech-1.4/',
        //     text: 'View NLP Paper'
        //   }
        ]
      },
      {
        title: 'Career Transition',
        description: 'Completed a year at Bytelearn and embarked on a new journey to the US for Masters in Data Science.',
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
        description: 'Mentored graduate students in Data Science courses, leading weekly lab sessions and office hours to clarify statistical concepts and data visualization techniques.',
      },
      {
        title: 'Research Project Experience',
        description: 'Worked as a Data Analyst in a research project during summer, applying theoretical knowledge to real-world problems.',
      },
      {
        title: 'Professional Growth',
        description: 'Joined Opal HTM as a Data and ML Engineer, combining data engineering with machine learning expertise for big data in health-tech.',
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
        description: 'Continued contributing to Opal HTM as a Data and ML Engineer, focusing on health-tech solutions. Simultaneously, completed Zach\'s Bootcamp, earning a superbness certificate.',
        links: [
          {
            url: 'https://drive.google.com/file/d/1p3Fr4oFL9U55M7T0f_L_OMSfhf3P5dJz/view?usp=sharing',
            text: 'View Certificate'
          }
        ],
      },
      {
        title: 'Open Source Contribution',
        description: 'Launched Betflow, an open-source project leveraging data engineering to build scalable data pipelines and analytics solutions.',
        links: [
          {
            url: 'https://github.com/sanchitvj/betflow',
            text: 'View on GitHub'
          }
        ]
      }
    ]
  },
  {
    id: 2025,
    year: 2025,
    activities: [
      {
        title: 'Brand Building & Growth',
        description: 'Focusing on establishing personal brand as a data engineer through articles and technical content writing.',
      },
      {
        title: 'Full-Stack Evolution',
        description: 'Expanding skillset beyond data engineering, working towards adding full-stack development to my skillset.',
      },
      {
        title: 'Project Portfolio',
        description: 'Actively working on multiple projects, embracing the journey while exploring new opportunities.',
      }
    ]
  },
];
// --- End Sample Data ---

// Make penguin dimensions responsive
const getPenguinDimensions = () => {
  if (typeof window === 'undefined') return { width: 60, height: 60 };
  const width = window.innerWidth;
  if (width < 640) return { width: 30, height: 30 }; // sm
  if (width < 768) return { width: 45, height: 45 }; // md
  if (width < 1024) return { width: 50, height: 50 }; // lg
  return { width: 60, height: 60 }; // xl and above
};

const TimelineSection: React.FC = () => {
  // Sort data by year just in case it's not
  const sortedTimelineData = [...timelineData].sort((a, b) => a.year - b.year);
  const firstYear = sortedTimelineData[0]?.year;
  const lastYear = sortedTimelineData[sortedTimelineData.length - 1]?.year;

  const [selectedYear, setSelectedYear] = useState<number | null>(lastYear ?? null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [penguinDimensions, setPenguinDimensions] = useState(getPenguinDimensions());

  // Initialize track width and update on resize
  useEffect(() => {
    // Initial setup
    if (trackRef.current) {
      setTrackWidth(trackRef.current.offsetWidth);
    }
    setPenguinDimensions(getPenguinDimensions());

    // Resize handler
    const handleResize = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth);
      }
      setPenguinDimensions(getPenguinDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getYearPosition = (year: number): number => {
    if (!trackWidth || firstYear === undefined || lastYear === undefined) return 0;
    if (lastYear === firstYear) return trackWidth / 2;
    const percentage = (year - firstYear) / (lastYear - firstYear);
    const effectiveTrackWidth = trackWidth - penguinDimensions.width;
    return (percentage * effectiveTrackWidth) + (penguinDimensions.width / 2);
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

  const penguinX = useMotionValue(selectedYear ? getYearPosition(selectedYear) - penguinDimensions.width / 2 : 0);
  useEffect(() => {
    if (selectedYear !== null) {
      penguinX.set(getYearPosition(selectedYear) - penguinDimensions.width / 2);
    }
  }, [selectedYear, trackWidth]);

  return (
    <section id="journey-section" className="py-20 relative">
      <div className="container mx-auto px-4">
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
              width: penguinDimensions.width,
              height: penguinDimensions.height
            }}
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: "grabbing" }}
          >
            <Image 
              src="/icons/laptop_penguin.svg"
              alt="Timeline marker"
              width={penguinDimensions.width}
              height={penguinDimensions.height}
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
                      {activity.links?.map((link, index) => (
                        <Link key={index} href={link.url} target="_blank" rel="noopener noreferrer">
                          <span className="inline-block text-blue-400 hover:text-blue-300 text-sm transition-colors underline mb-2">
                            {link.text}
                          </span>
                        </Link>
                      ))}
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