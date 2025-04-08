import { Skill } from '@/types/skill';

export const skills: Skill[] = [
  {
    id: 'python',
    name: 'Python',
    category: 'Programming',
    proficiency: 'Expert',
    yearsOfExperience: 5,
    projects: ['opal-htm', 'betflow', 'grag'],
    description: 'Extensive experience in Python for data processing, machine learning, and backend development.',
    icon: 'python.svg'
  },
  {
    id: 'spark',
    name: 'Apache Spark',
    category: 'Data',
    proficiency: 'Advanced',
    yearsOfExperience: 3,
    projects: ['opal-htm'],
    description: 'Proficient in Spark for large-scale data processing and analytics.',
    icon: 'spark.svg'
  },
  {
    id: 'aws',
    name: 'AWS',
    category: 'Cloud',
    proficiency: 'Advanced',
    yearsOfExperience: 4,
    projects: ['opal-htm', 'betflow'],
    description: 'Experience with various AWS services including EC2, S3, Lambda, and EMR.',
    icon: 'aws.svg'
  },
  {
    id: 'tensorflow',
    name: 'TensorFlow',
    category: 'Data',
    proficiency: 'Intermediate',
    yearsOfExperience: 2,
    projects: ['betflow'],
    description: 'Experience in building and deploying machine learning models using TensorFlow.',
    icon: 'tensorflow.svg'
  },
  {
    id: 'neo4j',
    name: 'Neo4j',
    category: 'Data',
    proficiency: 'Intermediate',
    yearsOfExperience: 2,
    projects: ['grag'],
    description: 'Experience in graph database design and querying.',
    icon: 'neo4j.svg'
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'Tools',
    proficiency: 'Advanced',
    yearsOfExperience: 3,
    projects: ['opal-htm', 'betflow'],
    description: 'Experience in containerization and microservices architecture.',
    icon: 'docker.svg'
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'Tools',
    proficiency: 'Intermediate',
    yearsOfExperience: 2,
    projects: ['opal-htm'],
    description: 'Experience in container orchestration and deployment.',
    icon: 'kubernetes.svg'
  },
  {
    id: 'communication',
    name: 'Communication',
    category: 'Soft Skills',
    proficiency: 'Expert',
    yearsOfExperience: 5,
    projects: ['opal-htm', 'betflow', 'grag'],
    description: 'Strong communication skills for technical and non-technical audiences.',
  }
]; 