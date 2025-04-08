export interface Project {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  technologies: string[];
  metrics: {
    [key: string]: string | number;
  };
  imageUrl: string;
  githubUrl?: string;
  demoUrl?: string;
  features: string[];
  challenges: string[];
  solutions: string[];
  architecture?: string;
} 