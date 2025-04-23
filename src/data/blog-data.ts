import { BlogPost } from '../types/blog';

// Blog categories
export const blogCategories = [
  // { id: 'all', label: 'All Stations' },
  { id: 'data_engineering', label: 'Data Engineering' },
  // { id: 'architecture', label: 'Architecture' },
  { id: 'data-quality', label: 'Data Quality' },
  { id: 'optimization', label: 'Optimization' },
//   { id: 'tools', label: 'Tools & Utilities' },
//   { id: 'future-tech', label: 'Future Tech' },
//   { id: 'trends', label: 'Trends & Analysis' },
//   { id: 'spark', label: 'Apache Spark' },
  // { id: 'real-time', label: 'Real-Time Analytics' },
//   { id: 'career', label: 'Career Growth' },
//   { id: 'job-hunting', label: 'Job Hunting' },
  { id: 'humor', label: 'Humor' },
  // { id: 'duckdb', label: 'DuckDB' },
  { id: 'open_source', label: 'Open Source' },
  { id: 'ai', label: 'AI' },
  { id: 'learning', label: 'Learning' },
  { id: 'achievement', label: 'Achievement' },
//   { id: 'sports-analytics', label: 'Sports Analytics' }
];

// Blog posts data
export const blogPosts: BlogPost[] = [
  // LinkedIn Iframe Posts
  {
    id: 'linkedin-iframe-1',
    title: 'Data Engineers, I See You',
    excerpt: 'For the data engineers crafting elegant pipelines while fending off requests to "just dump it in a data lake".',
    content: 'LinkedIn post content about data engineering.',
    date: '2024-08-30',
    readTime: '2 min',
    category: ['data_engineering', 'humor'],
    type: 'linkedin-iframe',
    link: 'https://www.linkedin.com/embed/feed/update/urn:li:share:7311566965100158979'
  },
  {
    id: 'linkedin-iframe-2',
    title: 'Data Engineering Efficiency with Pandas',
    excerpt: 'Tips for optimizing data pipeline performance in Python.',
    content: 'LinkedIn post content about data engineering efficiency with Pandas.',
    date: '2024-09-01',
    readTime: '2 min',
    category: ['data_engineering', 'python'],
    type: 'linkedin-iframe',
    link: 'https://www.linkedin.com/embed/feed/update/urn:li:share:7311910318933192707'
  },
  {
    id: 'linkedin-iframe-3',
    title: 'Sports Analytics Insights',
    excerpt: 'How data pipelines are transforming sports analytics and decision making.',
    content: 'LinkedIn post content about sports analytics insights.',
    date: '2024-08-10',
    readTime: '3 min',
    category: ['data_engineering', 'sports-analytics'],
    type: 'linkedin-iframe',
    link: 'https://www.linkedin.com/embed/feed/update/urn:li:share:7305702724786868225'
  },
  {
    id: 'linkedin-iframe-4',
    title: 'Tuning Spark for Real-Time Processing',
    excerpt: 'Essential configuration tips for Apache Spark in real-time processing scenarios.',
    content: 'LinkedIn post content about tuning Spark for real-time processing.',
    date: '2024-09-05',
    readTime: '2 min',
    category: ['data_engineering', 'spark'],
    type: 'linkedin-iframe',
    link: 'https://www.linkedin.com/embed/feed/update/urn:li:share:7313433102393962496'
  },
  // Original linkedin-iframe-1 (now redundant but keeping for backward compatibility)
  {
    id: 'linkedin-iframe-old',
    title: 'Featured LinkedIn Post',
    excerpt: 'Check out this featured LinkedIn post about data engineering insights and best practices.',
    content: 'Featured LinkedIn post content about data engineering insights and best practices.',
    date: '2024-09-15',
    readTime: '3 min',
    category: ['data_engineering'],
    type: 'linkedin-iframe',
    link: 'https://www.linkedin.com/embed/feed/update/urn:li:share:7317758551194550272'
  },
  {
    id: 'linkedin-1',
    title: 'Tuning Spark for Real-Time Risk Detection',
    excerpt: 'Ever tuned Spark for real-time risk detection? Miss one config, and your fraud alerts arrive after the transaction clears. Key takeaways: Off-heap = Low Latency, Dynamic Allocation = Cost Control, Memory Overhead = Stability.',
    content: 'Post content about tuning Spark for real-time risk detection.',
    date: '2024-09-05',
    readTime: '1 min',
    category: ['data_engineering'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay_lookingforjob-apachespark-realtimeanalytics-activity-7313606229807767552-rDUA'
  },
  {
    id: 'linkedin-2',
    title: 'Rejection Is Redirection',
    excerpt: 'I\'m excited to announce that… …I didn\'t get the job. But why is this still a win? Recently, I went through an interview process with a promising startup. While I didn\'t land the role, the experience was invaluable.',
    content: 'Post content about rejection and redirection in job searching.',
    date: '2024-09-01',
    readTime: '1 min',
    category: ['career'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay_lookingforjob-dataengineer-rejection-activity-7312881444811350019-C-gY'
  },
  {
    id: 'linkedin-3',
    title: 'Data Engineers, I See You',
    excerpt: 'Juggling a dozen different cloud services, trying to explain to stakeholders why we can\'t just "AI" everything. To the Data Engineers out there crafting elegant pipelines while fending off requests to \'just dump it in a data lake\'.',
    content: 'Post content about the challenges of data engineering.',
    date: '2024-08-28',
    readTime: '1 min',
    category: ['data_engineering', 'humor'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay_lookingforjob-dataengineering-analytics-activity-7311566966463307776-kvhV'
  },
  {
    id: 'linkedin-4',
    title: 'DuckDB in Production',
    excerpt: 'Thoughts on using DuckDB in production environments for data engineering workflows.',
    content: 'Post content about using DuckDB in production environments.',
    date: '2024-08-26',
    readTime: '1 min',
    category: ['data_engineering', 'duckdb'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay_lookingforjob-dataengineering-duckdb-activity-7310797708842168320-lahq'
  },
  {
    id: 'linkedin-5',
    title: 'Open Source Contributions',
    excerpt: 'Insights on contributing to open source AI projects and community-driven development.',
    content: 'Post content about contributing to open source AI projects.',
    date: '2024-07-29',
    readTime: '1 min',
    category: ['open_source', 'ai'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay_opensource-gwospo-ai-activity-7292689124489142272-ga56'
  },
  {
    id: 'linkedin-6',
    title: 'Sports Analytics with Data Engineering',
    excerpt: 'Exploring the intersection of data engineering, open source tools, and sports analytics.',
    content: 'Post content about the intersection of data engineering and sports analytics.',
    date: '2024-07-22',
    readTime: '1 min',
    category: ['data_engineering', 'sports-analytics', 'open_source'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay_dataengineering-opensource-sportsanalytics-activity-7290234189788893185-dLwx'
  },
  // Additional LinkedIn Posts
  {
    id: 'linkedin-7',
    title: 'Scaling Data Pipelines with Apache Airflow',
    excerpt: 'Best practices for managing complex data dependencies and ensuring reliability at scale with Apache Airflow.',
    content: 'Post content about scaling data pipelines with Apache Airflow.',
    date: '2024-07-15',
    readTime: '1 min',
    category: ['data_engineering', 'airflow', 'scaling'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay'
  },
  {
    id: 'linkedin-8',
    title: 'Databricks vs. EMR: Making the Right Choice',
    excerpt: 'Comparing cloud-based Spark platforms for enterprise data processing workloads.',
    content: 'Post content comparing Databricks and EMR for data processing.',
    date: '2024-07-08',
    readTime: '1 min',
    category: ['data_engineering', 'cloud', 'spark'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay'
  },
  {
    id: 'linkedin-9',
    title: 'Python Tips for Data Engineers',
    excerpt: 'Productivity hacks and coding patterns to level up your data engineering Python code.',
    content: 'Post content with Python tips for data engineers.',
    date: '2024-07-01',
    readTime: '1 min',
    category: ['data_engineering', 'python', 'coding'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay'
  },
  {
    id: 'linkedin-10',
    title: 'The Future of GPU-Accelerated Analytics',
    excerpt: 'How RAPIDS and other GPU frameworks are transforming data processing speed for data scientists and engineers.',
    content: 'Post content about GPU-accelerated analytics and RAPIDS.',
    date: '2024-06-25',
    readTime: '1 min',
    category: ['data_engineering', 'gpu', 'analytics'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay'
  },
  {
    id: 'linkedin-11',
    title: 'Vector Databases: Beyond the Hype',
    excerpt: 'What are vector databases good for? When should you use them in your data architecture?',
    content: 'Post content exploring the use cases for vector databases.',
    date: '2024-06-18',
    readTime: '1 min',
    category: ['data_engineering', 'vector-db', 'architecture'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay'
  },
  {
    id: 'linkedin-12',
    title: 'Data Mesh Implementation Lessons',
    excerpt: 'Practical challenges and solutions from implementing a data mesh architecture at scale.',
    content: 'Post content about data mesh implementation challenges and solutions.',
    date: '2024-06-10',
    readTime: '1 min',
    category: ['data_engineering', 'data-mesh', 'architecture'],
    type: 'linkedin-post',
    link: 'https://www.linkedin.com/posts/sanchit-vijay'
  },
  // Original blog posts
  {
    id: 'post-1',
    title: 'Optimizing Data Lakes for Arctic Conditions',
    excerpt: 'How to structure your data lakes for optimal performance in cold storage environments.',
    content: 'Full article about optimizing data lakes for cold storage environments.',
    date: '2023-11-15',
    readTime: '5 min',
    category: ['data_engineering', 'optimization'],
    type: 'research-report',
    link: 'https://linkedin.com/in/sanchitvj',
    image: '/images/blog/data-lake.jpg',
    featured: true
  },
  {
    id: 'post-2',
    title: 'Quick Tip: Improving Spark Performance',
    excerpt: 'A quick optimization tip for your Spark jobs.',
    content: 'Detail on improving Spark performance through configuration and coding practices.',
    date: '2023-11-10',
    readTime: '2 min',
    category: 'data_engineering',
    type: 'quick-note',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-3',
    title: 'Deep Dive: The Architecture of Modern Data Platforms',
    excerpt: 'A comprehensive analysis of data platform architectures and how they have evolved.',
    content: 'Comprehensive analysis of modern data platform architectures and their evolution.',
    date: '2023-10-28',
    readTime: '15 min',
    category: ['architecture', 'data_engineering'],
    type: 'comprehensive-study',
    link: 'https://substack.com',
    image: '/images/blog/architecture.jpg'
  },
  {
    id: 'post-4',
    title: 'Data Quality Monitoring Best Practices',
    excerpt: 'Essential strategies for maintaining high-quality data in your pipelines.',
    content: 'Detailed strategies for implementing data quality monitoring in pipelines.',
    date: '2023-10-15',
    readTime: '8 min',
    category: 'data-quality',
    type: 'research-report',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-5',
    title: 'Quick Note: Useful dbt Commands',
    excerpt: 'Handy dbt commands to improve your workflow.',
    content: 'Collection of useful dbt commands with explanations on when and how to use them.',
    date: '2023-10-05',
    readTime: '3 min',
    category: 'tools',
    type: 'quick-note',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-6',
    title: 'The Future of Data Engineering: Predictions for 2024',
    excerpt: 'Where is data engineering headed? My predictions for the coming year.',
    content: 'Analysis and predictions about the future trends in data engineering for 2024.',
    date: '2023-09-20',
    readTime: '12 min',
    category: ['future-tech', 'trends'],
    type: 'comprehensive-study',
    link: 'https://substack.com',
    image: '/images/blog/future.jpg'
  },
  // Additional Quick Notes
  {
    id: 'post-7',
    title: 'SQL Optimization Checklist',
    excerpt: 'Essential tips for improving query performance in your data warehouse.',
    date: '2023-09-15',
    readTime: '3 min',
    category: ['data_engineering', 'sql', 'optimization'],
    type: 'quick-note',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-8',
    title: 'Setting Up Snowflake for Maximum Security',
    excerpt: 'Quick configuration tips to ensure your Snowflake instance follows security best practices.',
    date: '2023-09-10',
    readTime: '2 min',
    category: ['data_engineering', 'snowflake', 'security'],
    type: 'quick-note',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-9',
    title: 'Monitoring Spark Jobs Efficiently',
    excerpt: 'How to set up effective alerts and dashboards for your Apache Spark workloads.',
    date: '2023-09-05',
    readTime: '3 min',
    category: ['data_engineering', 'spark', 'monitoring'],
    type: 'quick-note',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-10',
    title: 'Debugging Memory Issues in Python Data Pipelines',
    excerpt: 'Common memory leaks and how to identify them in your Python ETL code.',
    date: '2023-09-01',
    readTime: '4 min',
    category: ['data_engineering', 'python', 'debugging'],
    type: 'quick-note',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-11',
    title: 'Pandas vs. Polars: When to Switch',
    excerpt: 'A quick comparison of the two dataframe libraries and guidance on choosing the right one.',
    date: '2023-08-25',
    readTime: '3 min',
    category: ['data_engineering', 'python', 'tools'],
    type: 'quick-note',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-12',
    title: 'Delta Lake Table Maintenance Checklist',
    excerpt: 'Regular maintenance tasks to keep your Delta Lake tables performing optimally.',
    date: '2023-08-20',
    readTime: '2 min',
    category: ['data_engineering', 'delta-lake', 'maintenance'],
    type: 'quick-note',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  // Additional Research Reports
  {
    id: 'post-13',
    title: 'Building Streaming Data Platforms with Kafka and Spark',
    excerpt: 'A detailed guide to designing and implementing real-time data processing architectures.',
    date: '2023-08-15',
    readTime: '10 min',
    category: ['data_engineering', 'kafka', 'spark', 'streaming'],
    type: 'research-report',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-14',
    title: 'Data Engineering in the Era of Large Language Models',
    excerpt: 'How LLMs are changing the way we process, analyze, and derive value from data.',
    date: '2023-08-10',
    readTime: '7 min',
    category: ['data_engineering', 'llm', 'ai'],
    type: 'research-report',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-15',
    title: 'Optimizing Data Lake Storage Costs',
    excerpt: 'Strategies for reducing cloud storage costs while maintaining performance and accessibility.',
    date: '2023-08-05',
    readTime: '6 min',
    category: ['data_engineering', 'data-lake', 'cost-optimization'],
    type: 'research-report',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-16',
    title: 'Graph Databases for Connected Data Analysis',
    excerpt: 'When and how to use graph databases to gain insights from highly connected datasets.',
    date: '2023-07-30',
    readTime: '9 min',
    category: ['data_engineering', 'graph-databases', 'analytics'],
    type: 'research-report',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-17',
    title: 'Modern Data Stack Architecture Patterns',
    excerpt: 'Emerging patterns in the modern data stack and how to implement them effectively.',
    date: '2023-07-25',
    readTime: '8 min',
    category: ['data_engineering', 'architecture', 'modern-data-stack'],
    type: 'research-report',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  {
    id: 'post-18',
    title: 'Data Governance in the Age of Self-Service Analytics',
    excerpt: 'Balancing flexibility and control in modern data platforms.',
    date: '2023-07-20',
    readTime: '7 min',
    category: ['data_engineering', 'governance', 'self-service'],
    type: 'research-report',
    link: 'https://linkedin.com/in/sanchitvj'
  },
  // Additional Comprehensive Studies
  {
    id: 'post-19',
    title: 'The Evolution of Data Engineering: From ETL to ELT and Beyond',
    excerpt: 'A historical perspective on how data engineering practices have evolved and where they\'re heading.',
    date: '2023-07-15',
    readTime: '20 min',
    category: ['data_engineering', 'etl', 'elt', 'history'],
    type: 'comprehensive-study',
    link: 'https://substack.com',
    image: '/images/blog/future.jpg'
  },
  {
    id: 'post-20',
    title: 'Real-time Data Processing Architectures: A Deep Dive',
    excerpt: 'Comparing Lambda, Kappa, and hybrid architectures for real-time data processing at scale.',
    date: '2023-07-10',
    readTime: '18 min',
    category: ['data_engineering', 'streaming', 'architecture', 'real-time'],
    type: 'comprehensive-study',
    link: 'https://substack.com',
    image: '/images/blog/architecture.jpg'
  },
  {
    id: 'post-21',
    title: 'Lakehouse Architecture: The Best of Both Worlds',
    excerpt: 'How lakehouse architectures combine the flexibility of data lakes with the performance of data warehouses.',
    date: '2023-07-05',
    readTime: '15 min',
    category: ['data_engineering', 'lakehouse', 'architecture'],
    type: 'comprehensive-study',
    link: 'https://substack.com',
    image: '/images/blog/data-lake.jpg'
  },
  {
    id: 'post-22',
    title: 'The Future of Data Mesh: From Theory to Practice',
    excerpt: 'Detailed implementation strategies for data mesh architectures in enterprise environments.',
    date: '2023-07-01',
    readTime: '22 min',
    category: ['data_engineering', 'data-mesh', 'architecture'],
    type: 'comprehensive-study',
    link: 'https://substack.com',
    image: '/images/blog/future.jpg'
  },
  {
    id: 'post-23',
    title: 'Machine Learning Infrastructure for Data Engineers',
    excerpt: 'Building and maintaining the infrastructure that supports ML workflows at scale.',
    date: '2023-06-25',
    readTime: '16 min',
    category: ['data_engineering', 'ml-ops', 'infrastructure'],
    type: 'comprehensive-study',
    link: 'https://substack.com',
    image: '/images/blog/architecture.jpg'
  },
  {
    id: 'post-24',
    title: 'Data Engineering in Multi-Cloud Environments',
    excerpt: 'Strategies for designing and implementing data platforms that span multiple cloud providers.',
    date: '2023-06-20',
    readTime: '17 min',
    category: ['data_engineering', 'multi-cloud', 'architecture'],
    type: 'comprehensive-study',
    link: 'https://substack.com',
    image: '/images/blog/future.jpg'
  },
  {
    id: 'youtube-1',
    title: 'Data Engineering Best Practices',
    excerpt: 'Comprehensive guide to data engineering best practices and methodologies.',
    content: 'Video content about data engineering best practices.',
    type: 'youtube',
    date: '2024-03-15',
    youtubeUrl: 'https://youtu.be/QOwDZPlyO5w',
    thumbnail: 'https://img.youtube.com/vi/QOwDZPlyO5w/maxresdefault.jpg'
  },
  {
    id: 'youtube-2',
    title: 'Building Data Pipelines with Python',
    excerpt: 'Learn how to build efficient data pipelines using Python and modern tools.',
    content: 'Video content about building data pipelines with Python.',
    type: 'youtube',
    date: '2024-03-10',
    youtubeUrl: 'https://youtu.be/aaCbpYvjolk',
    thumbnail: 'https://img.youtube.com/vi/aaCbpYvjolk/maxresdefault.jpg'
  },
  {
    id: 'youtube-3',
    title: 'Advanced Data Processing Techniques',
    excerpt: 'Explore advanced techniques for processing and analyzing large datasets.',
    content: 'Video content about advanced data processing techniques.',
    type: 'youtube',
    date: '2024-03-05',
    youtubeUrl: 'https://youtu.be/XD2b8V_RfFc?t=1493',
    thumbnail: 'https://img.youtube.com/vi/XD2b8V_RfFc/maxresdefault.jpg'
  }
]; 