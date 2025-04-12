export interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  technologies: string[];
  features?: string[];
  isExternal?: boolean;
  category?: string;
  objective?: string;
  architecture?: string;
  challenges?: string[];
  solutions?: string[];
  metrics?: Array<{
    label: string;
    value: string;
  }>;
} 