'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, time } from 'framer-motion';
import { FaBriefcase, FaGraduationCap, FaCode, FaDatabase, FaCloud, FaBrain, FaTools } from 'react-icons/fa';
import Link from 'next/link';

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
  details: string;
  achievements: (string | JSX.Element)[];
}

const experiences: Experience[] = [
  {
    title: "Data Engineer",
    company: <a href="https://www.opalhtm.tech/" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Opal HTM</a>,
    period: "Oct 2023 - Present",
    base_description: "Modernized healthcare analytics for medical device data, designing cloud-native pipelines with predictive ML algorithms to process 50M+ daily records with 85% faster insights. Built scalable serverless systems and Spark optimizations to reduce costs by 30% while ensuring HIPAA compliance and enabling ML-powered utilization tracking for device maintenance and operational decisions.",
    detail_description: {
      data_engineering: [
        "Designed infrastructure for transforming terabyte-scale operational telemetry data, reducing processing latency by 85% through lakehouse architecture.",
        "Engineered serverless data ingestion for processing 50M+ records/trial, leveraging NoSQL databases for timestamp tracking, deduplication, and fault logging, ensuring 99.9% reliability",
        "Optimized Spark ETL pipelines, reducing processing time by 80% and enabling cross-functional teams to access analytics-ready datasets.",
        "Designed data quality frameworks and lineage tracking using Airflow, ensuring 99.9% data integrity and supporting strategic data governance initiatives.",
        "Architected data federation solution enabling Databricks Unity Catalog to query foreign-cataloged tables, cutting latency by 70% and eliminating need for data migration.",
        "Implemented data lineage tracking across Lake Formation and Unity Catalog, ensuring full data flow visibility for governance."
      ],
      machine_learning: [
        "Created Databricks pipeline jobs to update the Delta Lake feature store with 300M+ records, ensuring reliable data availability for model training and reducing manual data prep overhead.",
        "Implemented analyst-driven pipeline scheduling in Databricks, automating feature store refreshes as gold layer data updates, aligning data with model training needs.",
        "Implemented end-to-end MLOps framework for 6 medical device models using TensorFlow and MLflow, enabling automated retraining workflows, improving accuracy by 15%.",
        "Built production-grade model monitoring system using MLflow and TensorFlow Serving, tracking model drift across 6 device categories and implementing automated retraining triggers that maintained 90%+ model performance consistency.",
        "Achieved 90% accuracy in device state prediction, a 30% improvement over previous rule-based system implementation.",
        "Reduced incorrect state transition latency from 3 seconds to 0.2 seconds, decreasing operational errors by 93%."
      ]
    },
    technologies: ["Apache Spark", "Databricks", "Airflow", "GitHub Actions", "Terraform", "Athena", "Glue", "DynamoDB", "EMR", "ECS Fargate"]
  },
  // {
  //   title: "Creator",
  //   company: <a href="https://github.com/sanchitvj/sports_betting_analytics_engine" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Betflow</a>,
  //   period: "Nov 2024 - Present",
  //   base_description: "Developed real-time sports analytics platform with Lambda architecture, processing sports, odds, and weather events through real-time and batch pipelines. Built analytics dashboard, reducing streaming latency by 95% while cutting infrastructure costs by 60%. Implemented scalable data processing with Kafka, Spark, and Snowflake for sub-second analysis across sports markets.",
  //   detail_description: {
  //     data_engineering: [
  //       "Built Lambda architecture processing 400K+ daily records for sports betting platform.",
  //       "Integrated Kafka and Spark Streaming for sub-second market analysis.",
  //       "Engineered real-time data pipelines combining game, odds, and weather data.",
  //       "Reduced analytics latency to 5 seconds for time-sensitive betting decisions.",
  //       "Implemented SCD Type-2 and CDC patterns in DBT for historical trend analysis.",
  //       "Decreased daily warehouse compute costs by 60% using incremental processing strategies.",
  //       "Reduced storage costs by 90% while maintaining query performance on 100GB+ data.",
  //       "Designed multi-sport Grafana dashboards visualizing 1M+ daily betting events.",
  //       "Enabled sub-5 second dashboard refresh rates for real-time pattern detection."
  //     ],
  //     machine_learning: []
  //   },
  //   technologies: ["Spark", "AWS", "Airflow", "Glue", "Kafka", "Druid", "Snowflake", "DBT", "Grafana"]
  // },
  {
    title: "Data Engineer",
    company: <a href="https://www.bytelearn.com/" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Bytelearn</a>,
    period: "Jul 2021 - Jul 2022",
    base_description: "Engineered AI-driven educational tech solutions with AWS Glue and FastAPI for mathematical content recognition. Built YOLO-based models improving detection accuracy from 68% to 85% while reducing annotation effort by 80%. Implemented Docker-based workflows that accelerated development by 70%, enabling rapid iteration on educational features and improving content accessibility.",
    detail_description: {
      data_engineering: [
        "Built AWS Glue workflows improving dataset accuracy by 25% for product analytics.",
        "Designed FastAPI backend reducing manual annotation work by 80%.",
        "Created Streamlit UI improving video content rendering time by 60%.",
        "Developed modular algorithms cutting image processing development time by 70%.",
        "Implemented Docker containers ensuring reproducibility across 5+ systems.",
        "Established Agile workflows accelerating cross-functional collaboration by 40%."
      ],
      machine_learning: [
        "Trained YOLO models achieving 85% detection accuracy for mathematical content.",
        "Improved text understanding by 10% using NLP and OCR integration.",
        "Engineered AWS EC2-based training pipeline with PyTorch for object detection.",
        "Developed augmentation techniques generating diverse training data for models.",
        "Created feature extraction system for math questions and geometric figures."
      ]
    },
    technologies: ["Python", "AWS", "FastAPI", "Streamlit", "PyTorch", "Docker", "Agile"]
  }
];

const education: Education[] = [
  {
    degree: "Master's in Data Science",
    institution: "George Washington University",
    details: "Washington, DC, USA",
    achievements: [
      "Graduated with a 3.9 GPA, focusing on machine learning and data engineering",
      "Teaching Assistant for Data Science courses, mentoring class of 60+ students",
      "Worked as a Data Analyst in a research project for deriving actionable insights from IP Negotiation interview transcripts.",
      <>
        Completed capstone project{' '}
        <Link href="/projects#grag" className="text-data hover:text-data-light transition-colors">
          GRAG
        </Link>
        , RAG-based AI for extracting insights from private documents.
      </>
    ]
  },
  {
    degree: "Bachelor's in Electronics and Communication Engineering",
    institution: "Vellore Institute of Technology",
    details: "Vellore, TN, India",
    achievements: [
      // "Graduated with distinction, focusing on software development and data structures",
      // "Led multiple technical projects in data analysis and embedded systems",
      // "Active member of the coding club, organized hackathons and workshops",
      // "Completed internships in software development and data analysis"
    ]
  }
];

const ResumeSection = () => {
  const [expandedExperience, setExpandedExperience] = useState<number | null>(null);
  const [expandedEducation, setExpandedEducation] = useState<number | null>(null);
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
    <section id="resume-section" className="py-20 relative overflow-hidden">

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
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-data/10 text-data rounded-lg hover:bg-data/20 transition-colors"
              title="View Resume"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </h2>
          
          {/* Experience Section */}
          <div id="experience-section" className="mb-16">
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
                        transition={{ duration: 0.3, ease: "easeInOut" }}
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
                                        // transition={{ 
                                        //   duration: 0.3, 
                                        //   ease: "easeInOut",
                                        //   type: "spring",
                                        //   stiffness: 100,
                                        //   damping: 10
                                        // }}
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
                                        // transition={{ 
                                        //   duration: 0.3, 
                                        //   ease: "easeInOut",
                                        //   type: "spring",
                                        //   stiffness: 100,
                                        //   damping: 10
                                        // }}
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
                                className="px-3 py-1 bg-data/10 text-data rounded-full text-sm cursor-pointer hover:bg-data/20 transition-colors"
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
          <div id="education-section" className="mb-16">
            <div className="flex items-center mb-8">
              <FaGraduationCap className="text-3xl text-data mr-4" />
              <h3 className="text-2xl font-semibold text-white">Education</h3>
            </div>
            <div className="space-y-4">
              {education.map((edu, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-data/20 hover:border-data/40 transition-colors"
                >
                  <button
                    onClick={() => setExpandedEducation(expandedEducation === index ? null : index)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xl font-semibold text-white">{edu.degree}</h4>
                        <p className="text-data">{edu.institution}</p>
                      </div>
                      <div className="flex items-center gap-4">
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
                    <p className="mt-2 text-gray-300">{edu.details}</p>
                  </button>

                  <AnimatePresence>
                    {expandedEducation === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0">
                          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
                            {edu.achievements.map((achievement, i) => (
                              <li key={i}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Skills Section */}
          <div id="skills-section">
            <div className="flex items-center mb-8">
              <FaTools className="text-3xl text-data mr-4" />
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
                  <h4 className="text-xl font-semibold text-white">Cloud Services (AWS, Azure)</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['EMR', 'Glue', 'Athena', 'Redshift', 'IAM', 'Amplify', 'ECS', 'Lambda', 'Sagemaker', 'DynamoDB', 'Synapse', 'Fabric', 'Data Factory', 'Azure Containers', 'CosmosDB'].map((skill, i) => (
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
                  {['TensorFlow/Keras', 'PyTorch', 'Langchain', 'MLflow', 'FastAPI', 'Streamlit'].map((skill, i) => (
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

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <FaCode className="text-2xl text-data mr-2" />
                  <h4 className="text-xl font-semibold text-white">Full Stack Development</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Next.js', 'TypeScript', 'Node.js', 'Express', 'REST APIs', 'Tailwind CSS'].map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-data/10 text-data rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors"
              >
                <div className="flex items-center mb-4">
                  <FaCode className="text-2xl text-data mr-2" />
                  <h4 className="text-xl font-semibold text-white">Web Development</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['HTML5', 'CSS3', 'JavaScript', 'React Hooks', 'Context API', 'Redux', 'Next.js', 'Vercel', 'Netlify', 'Webpack', 'Babel', 'Jest', 'React Testing Library'].map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-data/10 text-data rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div> */}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResumeSection; 