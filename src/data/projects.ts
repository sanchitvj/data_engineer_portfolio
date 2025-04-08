import { Project } from '@/types/project';

export const projects: Project[] = [
  {
    id: 'opal-htm',
    title: 'Opal HTM',
    description: 'A high-throughput data processing system built with Python and Apache Spark, handling 50M+ records daily.',
    shortDescription: 'High-throughput data processing system for large-scale analytics',
    technologies: ['Python', 'Apache Spark', 'AWS', 'Docker', 'Kubernetes'],
    metrics: [
      { label: 'Daily Records', value: '50M+' },
      { label: 'Processing Time', value: '< 1 hour' },
      { label: 'Uptime', value: '99.99%' }
    ],
    imageUrl: '/images/projects/opal-htm.jpg',
    githubUrl: 'https://github.com/yourusername/opal-htm',
    features: [
      'Real-time data processing',
      'Scalable architecture',
      'Automated monitoring',
      'Data quality checks'
    ],
    challenges: [
      'Handling large data volumes',
      'Maintaining processing speed',
      'Ensuring data consistency'
    ],
    solutions: [
      'Implemented distributed processing',
      'Optimized Spark configurations',
      'Added comprehensive monitoring'
    ],
    architecture: 'Microservices-based architecture with container orchestration'
  },
  {
    id: 'betflow',
    title: 'BetFlow Analytics',
    description: 'Sports betting analytics platform providing real-time odds and predictions using machine learning models.',
    shortDescription: 'Sports betting analytics platform with ML predictions',
    technologies: ['Python', 'TensorFlow', 'PostgreSQL', 'FastAPI', 'React'],
    metrics: [
      { label: 'Prediction Accuracy', value: '85%' },
      { label: 'API Response Time', value: '< 100ms' },
      { label: 'Active Users', value: '10K+' }
    ],
    imageUrl: '/images/projects/betflow.jpg',
    demoUrl: 'https://betflow-demo.com',
    githubUrl: 'https://github.com/yourusername/betflow',
    features: [
      'Real-time odds calculation',
      'ML-based predictions',
      'User analytics dashboard',
      'API integration'
    ],
    challenges: [
      'Real-time data processing',
      'Model accuracy optimization',
      'Scalability under load'
    ],
    solutions: [
      'Implemented streaming architecture',
      'Used ensemble models',
      'Added caching layer'
    ]
  },
  {
    id: 'grag',
    title: 'GRAG (Graph-based Recommendation System)',
    description: 'A recommendation engine using graph neural networks to provide personalized content suggestions.',
    shortDescription: 'Graph-based recommendation system using GNNs',
    technologies: ['Python', 'PyTorch', 'Neo4j', 'Django', 'GraphQL'],
    metrics: [
      { label: 'Recommendation Accuracy', value: '92%' },
      { label: 'User Engagement', value: '+40%' },
      { label: 'Processing Speed', value: '100ms' }
    ],
    imageUrl: '/images/projects/grag.jpg',
    githubUrl: 'https://github.com/yourusername/grag',
    features: [
      'Graph-based recommendations',
      'Real-time updates',
      'User behavior analysis',
      'A/B testing framework'
    ],
    challenges: [
      'Graph data processing',
      'Real-time recommendations',
      'Scalability issues'
    ],
    solutions: [
      'Implemented GNN architecture',
      'Used graph databases',
      'Added caching mechanisms'
    ]
  }
]; 