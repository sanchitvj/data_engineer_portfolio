import { Project } from '../types/project';

export const projects: Project[] = [
  {
    id: 'betflow',
    title: 'Betflow',
    description: 'A comprehensive platform for betting flow analysis and management. This platform will be available as a page on this website.',
    features: [
      'Advanced data analytics for betting patterns',
      'Interactive visualization tools',
      'User-friendly dashboard interface'
    ],
    technologies: ['Spark', 'AWS', 'Snowflake', 'Kafka', 'DBT', 'Grafana', 'Airflow', 'Druid'],
    imageUrl: '/images/projects/betflow_2_0.png',
    isExternal: false
  },
  {
    id: 'grag',
    title: 'GRAG',
    description: 'A groundbreaking research project focused on retrieval-augmented generation technologies and applications.',
    features: [
      'Advanced retrieval mechanisms for information access',
      'State-of-the-art generation capabilities',
      'Efficient integration with existing systems'
    ],
    technologies: ['Python', 'Machine Learning', 'NLP', 'RAG', 'Vector Databases'],
    githubUrl: 'https://github.com/arjbingly/grag',
    demoUrl: 'https://g-rag.org',
    imageUrl: '/images/projects/grag.png',
    isExternal: true
  },
  {
    id: 'rsppunet',
    title: 'rsppUnet-BraTS-2021',
    description: 'A deep learning model for brain tumor segmentation using residual Spatial Pyramid Pooling-powered 3D U-Net architecture.',
    features: [
      'State-of-the-art medical image segmentation',
      'Improved brain tumor detection accuracy',
      'Efficient 3D volumetric processing'
    ],
    technologies: ['Python', 'PyTorch', 'Deep Learning', 'Medical Imaging', 'Computer Vision'],
    githubUrl: 'https://github.com/sanchitvj/rsppUnet-BraTS-2021',
    imageUrl: '/images/projects/rsppunet.png',
    isExternal: true
  },
  {
    id: 'image-dehazing',
    title: 'Image Dehazing',
    description: 'A novel approach to remove haze from images using a Gated Multi-scale Aggregation Network (GMAN-net).',
    features: [
      'Advanced image enhancement for hazy conditions',
      'Real-time dehazing capabilities',
      'Improved visual clarity for various applications'
    ],
    technologies: ['Python', 'TensorFlow', 'Computer Vision', 'Image Processing'],
    githubUrl: 'https://github.com/sanchitvj/Image-Dehazing-using-GMAN-net',
    imageUrl: '/images/projects/dehazing.png',
    isExternal: true
  },
  {
    id: 'confidential-project',
    title: 'Confidential Research Project',
    description: 'An innovative research initiative exploring cutting-edge technologies in data science and machine learning (details confidential).',
    features: [
      'Novel algorithmic approaches',
      'Cross-domain applications',
      'Performance optimization techniques'
    ],
    technologies: ['Machine Learning', 'Data Science', 'Python', 'Cloud Computing'],
    imageUrl: '/images/projects/confidential.png',
    isExternal: false
  }
]; 