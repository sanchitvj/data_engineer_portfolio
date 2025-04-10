'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, time } from 'framer-motion';
import { FaBriefcase, FaGraduationCap, FaCode, FaDatabase, FaCloud, FaBrain, FaTools } from 'react-icons/fa';
import PenguinFootprint from '../theme/PenguinFootprint';
import PenguinIcons from '../theme/PenguinIcons';

interface Experience {
  title: string;
  company: string | JSX.Element;
  period: string;
  base_description: string;
  detail_description: {
    data_engineering: string[];
    machine_learning: string[];
  };
  technologies: string[];
}

interface Education {
  degree: string;
  institution: string;
  period: string;
  // details: string;
}

const experiences: Experience[] = [
  {
    title: "Data Engineer",
    company: <a href="https://www.opalhtm.tech/" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Opal HTM</a>,
    period: "Oct 2023 - Present",
    base_description: "Modernized healthcare analytics for medical device data, designing cloud-native pipelines with predictive ML algorithms to process 50M+ daily records with 85% faster insights. Built scalable serverless systems and Spark optimizations to reduce costs by 30% while ensuring HIPAA compliance and enabling ML-powered utilization tracking for device maintenance and operational decisions.",
    detail_description: {
      data_engineering: [
        "Architected lakehouse pipeline for 50M+/day medical device data, reducing predictive analysis latency by 85%.",
        "Built serverless ingestion (Lambda/Fargate) processing 50M+ points/trial with DynamoDB-managed deduplication and fault isolation.",
        "Automated timestamp tracking via DynamoDB to flag modified source files, reducing reprocessing errors by 92%.",
        "Optimized Spark ETL workflows on AWS EMR, cutting processing time by 80% for Redshift integration.",
        "Deployed Airflow-monitored data validation (AWS Glue/Iceberg), reducing errors by 92% via automated checks.",
        "Accelerated Athena queries by 40% via Iceberg schema optimization for ad-hoc analytics.",
        "Automated CI/CD (GitHub Actions/Terraform), 3x deployment frequency and slashing cloud costs by 30%."
      ],
      machine_learning: [
        "Engineered Spark pipelines to process 300M+ records (100+ GB) with 40% improved throughput on Databricks.",
        "Designed multi-trial feature store separating 60% training/40% evaluation data, enabling robust model validation protocols.",
        "Implemented MLflow tracking across 35+ experiments, reducing model debugging time by 25% and ensuring reproducibility.",
        "Developed temporal component preservation technique for A/B testing across 20+ device trials and multiple states.",
        "Boosted prediction accuracy by 15% through temporal context retention, saving $120K annually in false negative costs.",
        "Achieved 90% accuracy in device state prediction, a 30% improvement over previous rule-based system implementation.",
        "Reduced incorrect state transition latency from 3 seconds to 0.2 seconds, decreasing operational errors by 93%."
      ]
    },
    technologies: ["Apache Spark", "Databricks", "AWS", "Airflow", "GitHub Actions", "Terraform", "Iceberg", "Athena", "Glue", "DynamoDB", "EMR", "ECS Fargate"]
  },
  {
    title: "Creator",
    company: <a href="https://github.com/sanchitvj/sports_betting_analytics_engine" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Betflow</a>,
    period: "Nov 2024 - Present",
    base_description: "Developed advanced ML-driven sports analytics platform with Lambda architecture, processing 400K+ daily events through real-time and batch pipelines. Built predictive models for market inefficiency detection, reducing decision latency by 95% while cutting infrastructure costs by 60%. Implemented scalable data processing with Kafka, Spark, and Snowflake, enabling sub-second analysis across multiple sports markets.",
    detail_description: {
      data_engineering: [
        "Built Lambda architecture processing 400K+ daily records for sports betting platform.",
        "Integrated Kafka and Spark Streaming for sub-second market analysis.",
        "Engineered real-time data pipelines combining game, odds, and weather data.",
        "Reduced analytics latency to 5 seconds for time-sensitive betting decisions.",
        "Implemented SCD Type-2 and CDC patterns in DBT for historical trend analysis.",
        "Decreased daily warehouse compute costs by 60% using incremental processing strategies.",
        "Reduced storage costs by 90% while maintaining query performance on 1TB+ data.",
        "Designed multi-sport Grafana dashboards visualizing 1M+ daily betting events.",
        "Enabled sub-5 second dashboard refresh rates for real-time pattern detection."
      ],
      machine_learning: []
    },
    technologies: ["Spark", "AWS", "Airflow", "Glue", "Kafka", "Druid", "Snowflake", "DBT", "Grafana"]
  },
  {
    title: "Data Engineer",
    company: <a href="https://www.bytelearn.com/" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Bytelearn</a>,
    period: "Jul 2021 - Jul 2022",
    base_description: "Built AWS Glue workflows to automate image metadata extraction, improving dataset accuracy by 25% for downstream analytics.",
    detail_description: {
      data_engineering: [
        "Designed annotation tool backend with FastAPI and UI with Streamlit, reducing manual work by 80% for image data and improving rendering time by 60% for video content.",
        "Developed algorithms for image data generation, ingestion of unstructured data, cutting development time by 70% through modularization.",
        "Employed Docker-based deployment environment with Agile workflows, ensuring reproducibility across 5+ systems and accelerating cross-functional collaboration."
      ],
      machine_learning: []
    },
    technologies: ["Python", "AWS", "FastAPI", "Streamlit", "Docker", "Agile"]
  }
];

const education: Education[] = [
  {
    degree: "Master's in Data Science",
    institution: "George Washington University",
    period: "Aug 2022 - May 2024",
    // details: "Specialized in Machine Learning and Big Data Analytics"
  },
  {
    degree: "Bachelor's in Electronics and Communication Engineering",
    institution: "Vellore Institute of Technology",
    period: "July 2016 - May 2020",
    // details: "Focus on Software Engineering and Database Systems"
  }
];

const ResumeSection = () => {
  const [expandedExperience, setExpandedExperience] = useState<number | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<{expIndex: number | null, blockType: 'data_engineering' | 'machine_learning' | null}>({expIndex: null, blockType: null});
  const [clickedBlocks, setClickedBlocks] = useState<{expIndex: number | null, blocks: ('data_engineering' | 'machine_learning')[]}>({expIndex: null, blocks: []});

  const handleClickOutside = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.detail-description')) {
      setClickedBlocks({expIndex: null, blocks: []});
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside as any);
    return () => {
      document.removeEventListener('click', handleClickOutside as any);
    };
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Penguin Footprints Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20">
          <PenguinFootprint opacity={0.1} className="text-white" />
        </div>
        <div className="absolute bottom-20 right-20">
          <PenguinFootprint opacity={0.1} className="text-white" />
        </div>
        <div className="absolute top-40 right-40">
          <PenguinFootprint opacity={0.1} className="text-white" />
        </div>
        <div className="absolute bottom-40 left-40">
          <PenguinFootprint opacity={0.1} className="text-white" />
        </div>
      </div>

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-12 text-center text-white flex items-center justify-center gap-4">
            Resume
            <a 
              href="/Sanchit_Vijay_Resume.pdf" 
              download
              className="p-2 bg-data/10 text-data rounded-lg hover:bg-data/20 transition-colors"
              title="Download Resume"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </h2>
          
          {/* Experience Section */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <FaBriefcase className="text-3xl text-data mr-4" />
              <h3 className="text-2xl font-semibold text-white">Experience</h3>
            </div>
            <div className="space-y-4">
              {experiences.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-colors"
                >
                  <button
                    onClick={() => setExpandedExperience(expandedExperience === index ? null : index)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xl font-semibold text-white">{exp.title}</h4>
                        <p className="text-data">{exp.company}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-300">{exp.period}</span>
                        <motion.div
                          animate={{ 
                            y: [0, 8, 0],
                            transition: {
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }
                          }}
                        >
                          <svg 
                            className="w-5 h-5 text-data" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M19 9l-7 7-7-7" 
                            />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-300">{exp.base_description}</p>
                  </button>

                  <AnimatePresence>
                    {expandedExperience === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 border-t border-data/20 detail-description">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Data Engineering Block */}
                            {exp.detail_description.data_engineering.length > 0 && (
                              <div className={`relative group ${exp.detail_description.machine_learning.length === 0 ? 'md:col-span-2 md:max-w-2xl md:mx-auto' : ''}`}>
                                <div
                                  className="bg-dark-200/30 p-4 rounded-lg border border-[#ff7700] cursor-pointer hover:border-[#ff7700] transition-colors"
                                  onMouseEnter={() => setHoveredBlock({expIndex: index, blockType: 'data_engineering'})}
                                  onMouseLeave={() => setHoveredBlock({expIndex: null, blockType: null})}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setClickedBlocks(prev => ({
                                      expIndex: index,
                                      blocks: prev.blocks.includes('data_engineering')
                                        ? prev.blocks.filter(b => b !== 'data_engineering')
                                        : [...prev.blocks, 'data_engineering']
                                    }));
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <FaDatabase className="text-[#ff7700]" />
                                    <h5 className="text-[#ff7700] font-semibold">Data Engineering</h5>
                                  </div>
                                  <AnimatePresence>
                                    {(hoveredBlock.expIndex === index && hoveredBlock.blockType === 'data_engineering') || 
                                     (clickedBlocks.expIndex === index && clickedBlocks.blocks.includes('data_engineering')) ? (
                                      <motion.ul
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="list-disc list-inside space-y-2 text-gray-300 text-sm"
                                      >
                                        {exp.detail_description.data_engineering.map((item, i) => (
                                          <li key={i}>{item}</li>
                                        ))}
                                      </motion.ul>
                                    ) : null}
                                  </AnimatePresence>
                                </div>
                              </div>
                            )}

                            {/* Machine Learning Block */}
                            {exp.detail_description.machine_learning.length > 0 && (
                              <div className={`relative group ${exp.detail_description.data_engineering.length === 0 ? 'md:col-span-2 md:max-w-2xl md:mx-auto' : ''}`}>
                                <div
                                  className="bg-dark-200/30 p-4 rounded-lg border border-[#DAA520] cursor-pointer hover:border-[#FFD700] transition-colors"
                                  onMouseEnter={() => setHoveredBlock({expIndex: index, blockType: 'machine_learning'})}
                                  onMouseLeave={() => setHoveredBlock({expIndex: null, blockType: null})}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setClickedBlocks(prev => ({
                                      expIndex: index,
                                      blocks: prev.blocks.includes('machine_learning')
                                        ? prev.blocks.filter(b => b !== 'machine_learning')
                                        : [...prev.blocks, 'machine_learning']
                                    }));
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <FaBrain className="text-[#DAA520]" />
                                    <h5 className="text-[#DAA520] font-semibold">Machine Learning</h5>
                                  </div>
                                  <AnimatePresence>
                                    {(hoveredBlock.expIndex === index && hoveredBlock.blockType === 'machine_learning') || 
                                     (clickedBlocks.expIndex === index && clickedBlocks.blocks.includes('machine_learning')) ? (
                                      <motion.ul
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="list-disc list-inside space-y-2 text-gray-300 text-sm"
                                      >
                                        {exp.detail_description.machine_learning.map((item, i) => (
                                          <li key={i}>{item}</li>
                                        ))}
                                      </motion.ul>
                                    ) : null}
                                  </AnimatePresence>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Technologies Section */}
                          <div className="flex flex-wrap gap-2">
                            {exp.technologies.map((tech, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-data/10 text-data rounded-full text-sm"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Education Section */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <FaGraduationCap className="text-3xl text-data mr-4" />
              <h3 className="text-2xl font-semibold text-white">Education</h3>
            </div>
            <div className="space-y-6">
              {education.map((edu, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-semibold text-white">{edu.degree}</h4>
                      <p className="text-data">{edu.institution}</p>
                      {/* <p className="text-gray-300 mt-2">{edu.details}</p> */}
                    </div>
                    <span className="text-gray-300">{edu.period}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div>
            <div className="flex items-center mb-8">
              <FaCode className="text-3xl text-data mr-4" />
              <h3 className="text-2xl font-semibold text-white">Technical Skills</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <FaCode className="text-2xl text-data mr-2" />
                  <h4 className="text-xl font-semibold text-white">Programming & Data Analysis</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Python', 'R', 'SQL', 'NoSQL', 'Postgres', 'Tableau', 'MS Excel', 'PySpark'].map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-data/10 text-data rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <FaBrain className="text-2xl text-data mr-2" />
                  <h4 className="text-xl font-semibold text-white">Machine Learning</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['TensorFlow/Keras', 'PyTorch', 'Langchain', 'MLflow', 'FastAPI', 'Streamlit', 'REST APIs'].map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-data/10 text-data rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <FaDatabase className="text-2xl text-data mr-2" />
                  <h4 className="text-xl font-semibold text-white">Data Engineering</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Snowflake', 'Databricks', 'Apache Spark', 'Kafka', 'Flink', 'Airflow', 'Druid', 'Superset', 'Hive', 'Hadoop', 'DBT', 'Polars', 'Dagster', 'Grafana', 'Trino', 'DuckDB'].map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-data/10 text-data rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <FaCloud className="text-2xl text-data mr-2" />
                  <h4 className="text-xl font-semibold text-white">Cloud Services (AWS)</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['EMR', 'Glue', 'Athena', 'Redshift', 'IAM', 'S3', 'EC2', 'ECS', 'ECR', 'Lambda', 'Sagemaker', 'DynamoDB'].map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-data/10 text-data rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <FaTools className="text-2xl text-data mr-2" />
                  <h4 className="text-xl font-semibold text-white">DevOps & CI/CD & Agile</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['GitHub Actions', 'CircleCI', 'Terraform', 'Jenkins', 'Docker', 'Jira', 'Confluence'].map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-data/10 text-data rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResumeSection; 