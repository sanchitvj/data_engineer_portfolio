'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaBriefcase, FaGraduationCap, FaCode, FaDatabase, FaCloud, FaBrain, FaTools } from 'react-icons/fa';
import PenguinFootprint from '../theme/PenguinFootprint';
import PenguinIcons from '../theme/PenguinIcons';

interface Experience {
  title: string;
  company: string | JSX.Element;
  period: string;
  description: string[];
  technologies: string[];
}

interface Education {
  degree: string;
  institution: string;
  period: string;
  details: string;
}

const experiences: Experience[] = [
  {
    title: "Data Engineer",
    company: <a href="https://www.opalhtm.tech/" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Opal HTM</a>,
    period: "Oct2023 - Present",
    description: [
      "Architected big data pipeline for medical device analytics following lakehouse architecture, reducing predictive analysis latency by 85%.",
      "Engineered serverless data ingestion system using AWS Lambda and ECS Fargate, processing 50M+ data points per trial with 99.9% data quality through DynamoDB tracking.",
      "Optimized Spark-based ETL pipelines on AWS EMR, reducing processing time by 80% and enabling seamless integration with Redshift for analytics workloads.",
      "Implemented data quality monitoring using Airflow, AWS Glue and Iceberg table format, enabling 40% faster query performance through Athena for ad-hoc analysis.",
      "Established infrastructure automation using GitHub Actions and Terraform, achieving 3x deployment frequency through containerized microservices (ECR), reducing cloud costs by 30%."
    ],
    technologies: ["Apache Spark", "AWS", "Airflow", "GitHub Actions", "Terraform", "Iceberg", "Athena", "Glue", "DynamoDB", "EMR", "ECS Fargate"]
  },
  {
    title: "Creator",
    company: <a href="https://github.com/sanchitvj/sports_betting_analytics_engine" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Betflow</a>,
    period: "Nov 2024 - Present",
    description: [
      "Architected sports betting platform using Lambda architecture, processing 400K+ records daily with Kafka, Spark Streaming, and Druid on local infrastructure enabling sub-second market analysis.",
      "Engineered data pipelines integrating real-time streams (games, odds, weather) with OLAP-based historical analysis using Snowflake and DBT, reducing analytics latency to 5 seconds.",
      "Accelerated analytics using incremental strategy, SCD Type-2, and CDC patterns in DBT, reducing daily warehouse compute cost by 60% while enabling betting market inefficiency detection.",
      "Orchestrated batch ETL using Airflow and optimized Snowflake external tables with Glue catalog integration, reducing warehouse storage costs by 90% while maintaining query performance for 1TB+ data.",
      "Designed multi-sport Grafana dashboards handling 1M+ daily events across betting analytics and market trends, enabling stakeholders to analyze patterns with sub-5 second refresh rate."
    ],
    technologies: ["Spark", "AWS", "Airflow", "Glue", "Kafka", "Druid", "Snowflake", "DBT", "Grafana"]
  },
  {
    title: "Data Engineer",
    company: <a href="https://www.bytelearn.com/" target="_blank" rel="noopener noreferrer" className="text-data hover:text-data-light transition-colors">Bytelearn</a>,
    period: "Jul 2021 - Jul 2022",
    description: [
      "Built AWS Glue workflows to automate image metadata extraction, improving dataset accuracy by 25% for downstream analytics.",
      "Designed annotation tool backend with FastAPI and UI with Streamlit, reducing manual work by 80% for image data and improving rendering time by 60% for video content.",
      "Developed algorithms for image data generation, ingestion of unstructured data, cutting development time by 70% through modularization.",
      "Employed Docker-based deployment environment with Agile workflows, ensuring reproducibility across 5+ systems and accelerating cross-functional collaboration."
    ],
    technologies: ["Python", "AWS", "FastAPI", "Streamlit", "Docker", "Agile"]
  }
];

const education: Education[] = [
  {
    degree: "Master's in Data Science",
    institution: "George Washington University",
    period: "Aug 2022 - May 2024",
    details: "Specialized in Machine Learning and Big Data Analytics"
  },
  {
    degree: "Bachelor's in Electronics and Communication Engineering",
    institution: "Vellore Institute of Technology",
    period: "July 2016 - May 2020",
    details: "Focus on Software Engineering and Database Systems"
  }
];

const ResumeSection = () => {
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
            <div className="space-y-8">
              {experiences.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-dark-200/50 backdrop-blur-sm p-6 rounded-lg border border-data/20 hover:border-data/40 transition-colors relative group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-white">{exp.title}</h4>
                      <p className="text-data">{exp.company}</p>
                    </div>
                    <span className="text-gray-300">{exp.period}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-2 mb-4 text-gray-300">
                    {exp.description.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <div className="absolute right-0 top-0 h-full w-48 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="absolute right-0 top-0 h-full w-48 bg-dark-200/80 backdrop-blur-sm p-4 translate-x-full">
                      <h5 className="text-white font-semibold mb-2">Technologies</h5>
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
                  </div>
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
                      <p className="text-gray-300 mt-2">{edu.details}</p>
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