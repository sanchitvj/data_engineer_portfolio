'use client';

import React, { useState } from 'react';
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

const AboutSection: React.FC = () => {
  const [activePipeline, setActivePipeline] = useState<keyof Skills>('Data Sources');

  return (
    <section id="about-section" className="py-20 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-8 text-center text-white">About Me</h2>

          {/* Terminal-themed Personal Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-black/70 backdrop-blur-sm p-6 rounded-lg border border-gray-700 mb-16 font-mono text-sm text-green-400 shadow-lg mx-auto"
          >
            <div className="flex items-center mb-2">
              <span className="text-blue-400 mr-2">user@penguin-os:</span>
              <span className="text-white">~/about</span>
              <span className="text-blue-400 ml-2">$</span>
            </div>
            <div className="mb-2">
              <span className="mr-2">🐧</span>
              <span>whoami</span>
            </div>
            <div className="mb-4 text-gray-300">
              <p>A data engineer who transforms raw information into structured insights, just like a penguin navigating through icy data lakes.</p>
            </div>
            <div className="mb-2">
              <span className="mr-2">🐧</span>
              <span>specialization</span>
            </div>
            <div className="mb-4 text-gray-300">
              <p>Building robust data pipelines that help organizations make data-driven decisions. Diving deep into complex data ecosystems to surface clear, actionable insights.</p>
            </div>
            <div className="mb-2">
              <span className="mr-2">🐧</span>
              <span>philosophy</span>
            </div>
            <div className="text-gray-300">
              <p>Much like penguins thrive in colonies, I believe in collaborative data engineering to navigate the vast ocean of data with confidence and precision.</p>
            </div>
          </motion.div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700 hover:border-blue-400/50 transition-colors relative z-10 text-center shadow-md"
              >
                <div className="text-3xl font-bold text-blue-400 mb-2 font-mono">{metric.value}</div>
                <div className="text-gray-400 text-sm font-sans">{metric.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Pipeline Visualization */}
          <div className="relative">
            {/* Pipeline Tabs - Updated styling */}
            <div className="flex justify-center space-x-4 mb-8 flex-wrap px-2">
              {(Object.keys(skills) as Array<keyof Skills>).map((category) => (
                <button
                  key={category}
                  onClick={() => setActivePipeline(category)}
                  className={`px-6 py-2 rounded-lg transition-colors text-sm font-mono my-1 ${
                    activePipeline === category
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Pipeline Content - Updated styling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(skills[activePipeline] as Skill[]).map((skill: Skill, index) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700 hover:border-blue-400/50 transition-colors relative z-10 shadow-md"
                >
                  <div className="text-3xl mb-4 text-blue-400">{skill.icon}</div>
                  <h3 className="text-xl font-semibold mb-2 text-white font-sans">{skill.name}</h3>
                  <p className="text-gray-400 text-sm font-sans">{skill.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection; 