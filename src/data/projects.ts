import { Project } from '../types/project';

export const projects: Project[] = [
  {
    id: 'dare',
    title: 'DARE',
    description: 'Data & AI Repository of Experiments - A collection of experiments and benchmarks for modern data engineering and AI tools.',
    objective: 'Provide a comprehensive testing ground for evaluating and comparing modern data engineering tools, storage solutions, and AI integration patterns with focus on reproducibility and real-world scenarios.',
    features: [
      'Performance benchmarking across query engines',
      'Cost-effective cloud storage strategies',
      'Cross-platform compatibility testing',
      'Real-world ETL/ELT pattern analysis',
      'Data migration between storage systems'
    ],
    architecture: 'Multi-cloud architecture testing framework that evaluates data storage solutions (Iceberg, Delta Lake), query engines (Spark, DuckDB, Polars), and cloud platforms (AWS, Cloudflare R2) with focus on operational overhead analysis.',
    challenges: 'Ensuring reproducibility across different environments, standardizing performance metrics across diverse tools, and maintaining cost-effectiveness while providing comprehensive benchmarking capabilities.',
    technologies: ['AWS', 'Snowflake', 'Databricks', 'DuckDB', 'Spark', 'Iceberg', 'Delta Lake'],
    metrics: [
      { label: 'Query Engines Tested', value: '3+' },
      { label: 'Storage Solutions', value: '5+' },
      { label: 'Cloud Platforms', value: '2+' },
    ],
    imageUrl: '/images/projects/dare_1.png',
    githubUrl: 'https://github.com/sanchitvj/DARE',
    isExternal: true
  },
  {
    id: 'betflow',
    title: 'Betflow',
    description: 'A data and analytics engineering platform designed for sports analytics combining streaming & batch processing capabilities.',
    objective: 'The purpose of this project is to simply offer analytics-as-a-product for analyzing transient data at huge scale.',
    features: [
      'Live game statistics processing',
      'Multi-source data integration',
      'Historical pattern recognition'
    ],
    architecture:'The platform processes both streaming data for immediate insights and historical data for pattern analysis, providing a complete solution for sports betting analytics.',
    challenges: 'The main challenge right now is to modify the existing architecture to the one above. Earlier, we were using Spark Streaming and Druid for real-time data processing. But compute cost for this setup is too high. So, we are trying to migrate to a new architecture using DuckDB.',
    technologies: ['Spark', 'AWS', 'Snowflake', 'Kafka', 'DBT', 'Grafana', 'Airflow', 'Druid'],
    metrics: [
      { label: 'Daily Events', value: '1M+' },
        { label: 'Latency', value: '10s' },
        { label: 'Cost Reduction', value: '90%' },
        // { label: 'Data Volume', value: '100TB+' },
        // { label: 'Data Volume', value: '100TB+' },
    ],
    imageUrl: '/images/projects/betflow_2_0.png',
    githubUrl: 'https://github.com/sanchitvj/sports_betting_analytics_engine',
    videoUrl: 'https://youtu.be/XD2b8V_RfFc?t=1493',
    isExternal: false
  },
  {
    id: 'stacktrend',
    title: 'Stacktrend',
    description: 'A data engineering solution for analyzing GitHub repository trends and technology adoption patterns using Fabric, Power BI, and analytics pipelines.',
    objective: 'Track open source technology adoption across developer ecosystems by combining automated data collection, LLM-powered classification, and real-time analytics to provide insights into technology trends and market intelligence.',
    features: [
      'Intelligent LLM-powered repository classification with Azure OpenAI',
      'Real-time analytics pipeline with automated data collection every 2 hours',
      'Medallion architecture with Bronze, Silver, and Gold data layers',
      'Cost-optimized smart classification reducing API calls by 90%',
      'Power BI dashboards with real-time KPI monitoring and mobile optimization'
    ],
    architecture: 'Modern medallion architecture pattern within Microsoft Fabric, creating seamless flow from GitHub API data collection through Delta Lake storage layers to Power BI dashboards, with Azure OpenAI integration for intelligent classification.',
    challenges: 'Implementing cost-effective LLM classification at scale, ensuring data quality across processing layers, and optimizing performance for real-time analytics while maintaining operational excellence in a unified Fabric environment.',
    technologies: ['Microsoft Fabric', 'Azure OpenAI', 'Delta Lake', 'Apache Spark', 'Power BI'],
    metrics: [
      { label: 'API Cost Reduction', value: '90%' },
      { label: 'Data Refresh Interval', value: '2 hours' },
      { label: 'Storage Format', value: 'Delta Lake' },
    ],
    imageUrl: '/images/projects/stacktrend.gif',
    githubUrl: 'https://github.com/sanchitvj/stacktrend',
    videoUrl: 'https://youtu.be/_owR-jd8nlY',
    isExternal: true
  },
  {
    id: 'grag',
    title: 'GRAG',
    description: 'GRAG is a simple python package that provides an easy end-to-end solution for implementing Retrieval Augmented Generation (RAG).',
    objective: 'The package offers an easy way for running various LLMs locally, Thanks to LlamaCpp and also supports vector stores like Chroma and DeepLake. It also makes it easy to integrage support to any vector stores easy.',
    features: [
      'Does not use any external services or APIs',
      'Processes unstructured data locally',
      'Solves data privacy concerns'
    ],
    technologies: ['Generative AI', 'RAG', 'LLM', 'Vector Databases', 'Langchain', 'Jenkins'],
    architecture: 'The parsing and partitioning were primarily done using the unstructured.io library, which is designed for this purpose. However, for PDFs with complex layouts, such as nested tables or tax forms, pdfplumber and pytesseract were employed to improve the parsing accuracy.',
    challenges: 'The main challenge was to make the package easy to use and understand.',
    metrics: [
      { label: 'Cookbooks Available', value: 'Yes' },
      { label: 'LLMs Supported', value: 'Meta Llama-2, Gemma, Mixtral' },
      // { label: 'Easy to integrate', value: 'Yes' },
    ],
    githubUrl: 'https://github.com/arjbingly/grag',
    demoUrl: 'https://g-rag.org',
    imageUrl: '/images/projects/grag.png',
    isExternal: true
  },
  {
    id: 'rsppunet',
    title: 'rsppUnet-BraTS-2021',
    description: 'A deep learning model for brain tumor segmentation using residual Spatial Pyramid Pooling-powered 3D U-Net architecture.',
    objective: 'Enhance MRI brain tumor segmentation using a 3D U-Net with Spatial Pyramid Pooling (SPP) and attention blocks to improve accuracy without increasing computational complexity.',
    features: [
      'Spatial Pyramid Pooling and attention integration',
      'Multi-scale feature aggregation',
      'Lightweight parameter efficiency',
      'Attention-guided context fusion (combines local/global features)',
      'Configurable SPP blocks (tested 1 or 2 SPP layers for optimal performance)'
    ],
    technologies: ['PyTorch', 'Medical Imaging', 'Computer Vision', '3D Image Processing'],
    architecture: '3D U-Net with residual SPP and attention blocks, processing MRI images at 160×192×192 resolution, using group normalization and Adam optimization.',
    challenges: 'Handling tumor size variability, avoiding gradient explosion with batch size 1, and balancing context without extra parameters.',
    metrics: [
      { label: 'Avg. Dice Score', value: '0.883' },
      // { label: 'Avg. Dice Score 2SPP', value: '0.876' },
      { label: 'Avg. Hausdorff Distance', value: '7.840' },
      // { label: 'Precision', value: '0.92' },
      // { label: 'Recall', value: '0.98' },
    ],
    githubUrl: 'https://github.com/sanchitvj/rsppUnet-BraTS-2021',
    publicationUrl: 'https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2023.1091850/full',
    imageUrl: '/images/projects/brats.png',
    isExternal: true
  },
  {
    id: 'image-dehazing',
    title: 'Image Dehazing',
    description: 'A novel approach to remove haze from images using a Generic Model-Agnostic Network (GMAN-net) and dilated convolutions.',
    objective: 'Enhance hazy images by removing atmospheric distortions using GMAN-Net (Generic Model-Agnostic Convolutional Neural Network) to restore visual clarity and detail.',
    features: [
      'Multi-scale adversarial training',
      'Attention-based feature refinement',
      'End-to-end haze removal'
    ],
    technologies: ['Python', 'TensorFlow', 'Computer Vision', 'Image Processing'],
    architecture: 'GMAN-Net combines a generator with residual blocks, multi-scale discriminators, and attention modules, trained using perceptual and adversarial losses.',
    challenges: 'Balancing detail preservation and haze removal, avoiding artifacts in dense haze, and computational efficiency.',
    metrics: [
      { label: 'PSNR (dB)', value: '28.5' },
      { label: 'SSIM', value: '0.92' },
      { label: 'CIEDE2000 (color accuracy)', value: '5.2' }
    ],
    githubUrl: 'https://github.com/sanchitvj/Image-Dehazing-using-GMAN-net',
    imageUrl: '/images/projects/image_dehazing.png',
    isExternal: true
  },
  // {
  //   id: 'confidential-project',
  //   title: 'Confidential Research Project',
  //   description: 'An innovative research initiative exploring cutting-edge technologies in data science and machine learning (details confidential).',
  //   features: [
  //     'Novel algorithmic approaches',
  //     'Cross-domain applications',
  //     'Performance optimization techniques'
  //   ],
  //   technologies: ['Machine Learning', 'Data Science', 'Python', 'Cloud Computing'],
  //   imageUrl: '/images/projects/confidential.png',
  //   isExternal: false
  // }
]; 