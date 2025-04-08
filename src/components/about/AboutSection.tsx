'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaDatabase, FaServer, FaCode, FaChartLine } from 'react-icons/fa';

interface Skill {
  name: string;
  icon: React.ReactNode;
  description: string;
}

interface Skills {
  'Data Sources': Skill[];
  'Processing': Skill[];
  'Analytics': Skill[];
}

const skills: Skills = {
  'Data Sources': [
    { name: 'SQL Databases', icon: <FaDatabase className="text-data" />, description: 'PostgreSQL, MySQL, MongoDB' },
    { name: 'Streaming Data', icon: <FaServer className="text-data" />, description: 'Kafka, Kinesis, Pub/Sub' },
    { name: 'APIs', icon: <FaCode className="text-data" />, description: 'REST, GraphQL, WebSockets' },
    { name: 'Data Lakes', icon: <FaDatabase className="text-data" />, description: 'S3, GCS, Azure Blob' },
  ],
  'Processing': [
    { name: 'ETL Pipelines', icon: <FaServer className="text-data" />, description: 'Apache Spark, Airflow' },
    { name: 'Data Modeling', icon: <FaDatabase className="text-data" />, description: 'Dimensional, Star Schema' },
    { name: 'Stream Processing', icon: <FaServer className="text-data" />, description: 'Flink, Spark Streaming' },
    { name: 'Data Quality', icon: <FaChartLine className="text-data" />, description: 'Great Expectations, dbt' },
  ],
  'Analytics': [
    { name: 'Data Warehousing', icon: <FaDatabase className="text-data" />, description: 'Snowflake, BigQuery' },
    { name: 'BI Tools', icon: <FaChartLine className="text-data" />, description: 'Tableau, Power BI' },
    { name: 'ML Pipelines', icon: <FaServer className="text-data" />, description: 'TensorFlow, PyTorch' },
    { name: 'Monitoring', icon: <FaChartLine className="text-data" />, description: 'Grafana, Prometheus' },
  ],
};

const metrics = [
  { label: 'Projects Completed', value: '25+' },
  { label: 'Data Processed Daily', value: '50M+' },
  { label: 'Query Optimization', value: '75%' },
  { label: 'Pipeline Efficiency', value: '90%' },
];

const DataNode = ({ x, y, size = 40, delay = 0 }) => (
  <motion.div
    className="absolute rounded-full bg-data/20 border-2 border-data"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
    }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

const DataParticle = ({ startX, startY, endX, endY, delay = 0 }) => {
  // Define the type for path points
  interface PathPoint {
    x: number;
    y: number;
  }

  // Generate random control points for a more organic path
  const generateRandomPath = (): PathPoint[] => {
    const numPoints = 8; // Increased number of points
    const points: PathPoint[] = [];
    const xStep = (parseFloat(endX) - parseFloat(startX)) / (numPoints - 1);
    
    for (let i = 0; i < numPoints; i++) {
      const x = parseFloat(startX) + (i * xStep);
      // More dramatic vertical movement
      const y = parseFloat(startY) + (Math.random() * 60 - 30);
      points.push({ x, y });
    }
    
    return points;
  };

  const pathPoints = generateRandomPath();
  
  return (
    <>
      {/* Main particle */}
      <motion.div
        className="absolute w-3 h-3 rounded-full bg-data"
        style={{
          x: startX,
          y: startY,
        }}
        animate={{
          x: pathPoints.map(point => `${point.x}%`),
          y: pathPoints.map(point => `${point.y}%`),
          opacity: [0, 1, 0.8, 0.4, 0],
        }}
        transition={{
          duration: 6, // Slower movement
          repeat: Infinity,
          delay,
          ease: "easeInOut",
          times: [0, 0.2, 0.4, 0.6, 1],
        }}
      />
      {/* Trail effect */}
      <motion.div
        className="absolute w-1 h-1 rounded-full bg-data/30"
        style={{
          x: startX,
          y: startY,
        }}
        animate={{
          x: pathPoints.map(point => `${point.x}%`),
          y: pathPoints.map(point => `${point.y}%`),
          opacity: [0, 0.5, 0.3, 0.1, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          delay: delay + 0.2, // Slightly delayed trail
          ease: "easeInOut",
          times: [0, 0.2, 0.4, 0.6, 1],
        }}
      />
    </>
  );
};

const ConnectingLine = ({ startX, startY, endX, endY }) => {
  // Define the type for line points
  interface LinePoint {
    x: number;
    y: number;
  }

  // Generate random control points for the line
  const generateLinePath = (): LinePoint[] => {
    const numPoints = 8; // More points for smoother curve
    const points: LinePoint[] = [];
    const xStep = (parseFloat(endX) - parseFloat(startX)) / (numPoints - 1);
    
    for (let i = 0; i < numPoints; i++) {
      const x = parseFloat(startX) + (i * xStep);
      const y = parseFloat(startY) + (Math.random() * 60 - 30); // More dramatic movement
      points.push({ x, y });
    }
    
    return points;
  };

  const [linePoints, setLinePoints] = useState<LinePoint[]>(generateLinePath());

  // Update line points periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLinePoints(generateLinePath());
    }, 2000); // Change shape every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Create SVG path from points
  const createPath = (points: LinePoint[]) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <div className="absolute inset-0">
      <svg className="w-full h-full">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <motion.path
          d={createPath(linePoints)}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1,
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Animated particles along the line */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-data/40"
          style={{
            left: startX,
            top: startY,
          }}
          animate={{
            x: linePoints.map(point => `${point.x}%`),
            y: linePoints.map(point => `${point.y}%`),
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          }}
        />
      ))}
    </div>
  );
};

export default function AboutSection() {
  const [mounted, setMounted] = useState(false);
  const [activePipeline, setActivePipeline] = useState<keyof Skills>('Data Sources');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-8 text-center text-white">About Me</h2>
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors relative z-10"
              >
                <div className="text-3xl font-bold text-data mb-2">{metric.value}</div>
                <div className="text-dark-400">{metric.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Pipeline Visualization */}
          <div className="relative min-h-[600px]">
            {/* Pipeline Tabs */}
            <div className="flex justify-center space-x-4 mb-8">
              {(Object.keys(skills) as Array<keyof Skills>).map((category) => (
                <button
                  key={category}
                  onClick={() => setActivePipeline(category)}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    activePipeline === category
                      ? 'bg-data text-white'
                      : 'bg-dark-200 text-dark-400 hover:bg-dark-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Pipeline Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(skills[activePipeline] as Skill[]).map((skill: Skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors relative z-10"
                >
                  <div className="text-3xl mb-4">{skill.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{skill.name}</h3>
                  <p className="text-dark-400">{skill.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Animated Data Network */}
            <div className="relative h-[400px] w-full mt-12">
              {/* Background Grid */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-4 opacity-5">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className="border border-data/20 rounded" />
                ))}
              </div>

              {/* Central Processing Node */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-data/20 border-2 border-data"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Satellite Nodes */}
              {Array.from({ length: 6 }).map((_, i) => {
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-data/20 border-2 border-data"
                    style={{
                      width: '6rem',
                      height: '6rem',
                    }}
                    animate={{
                      x: [0, Math.random() * window.innerWidth - 200, Math.random() * window.innerWidth - 200, 0],
                      y: [0, Math.random() * window.innerHeight - 200, Math.random() * window.innerHeight - 200, 0],
                      scale: [1, 1.5, 0.8, 1],
                      opacity: [0.3, 0.6, 0.4, 0.3],
                    }}
                    transition={{
                      duration: 8 + Math.random() * 4,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}

              {/* Data Flow Particles */}
              {Array.from({ length: 12 }).map((_, i) => {
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-data"
                    style={{
                      width: '0.5rem',
                      height: '0.5rem',
                    }}
                    animate={{
                      x: [0, Math.random() * window.innerWidth - 50, Math.random() * window.innerWidth - 50, 0],
                      y: [0, Math.random() * window.innerHeight - 50, Math.random() * window.innerHeight - 50, 0],
                      scale: [1, 2, 0.5, 1],
                      opacity: [0, 1, 0.5, 0],
                    }}
                    transition={{
                      duration: 6 + Math.random() * 3,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 