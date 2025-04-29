// Import new client component and data for projects
import { projects } from '@/data/projects';
import ProjectsClientContent from '@/components/projects/ProjectsClientContent';
import { Project } from '@/types/project';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects - Sanchit Vijay | Data Engineering & Machine Learning',
  description: 'Explore my portfolio of data engineering and machine learning projects, including real-time sports analytics, AI-powered document analysis, and more.',
  keywords: ['Data Engineering', 'Analytics Engineering', 'Machine Learning', 'Portfolio', 'Betflow', 'GRAG', 'Deep Learning'],
  openGraph: {
    title: 'Data Engineering & Machine Learning Projects - Sanchit Vijay',
    description: 'Explore innovative data engineering and machine learning projects by Sanchit Vijay',
    type: 'website',
    url: 'https://penguindb.me/projects',
    images: [
      {
        url: '/images/penguin_front_mac.png',
        width: 1200,
        height: 630,
        alt: 'Sanchit Vijay - Projects',
      },
    ],
  }
};

// Define project categories
const projectCategories = [
  'All',
  'Data Engineering',
  'AI',
  'Deep Learning', 
  'Research'
];

// Assign categories to projects and ensure required category field
const categorizedProjects = [
  {
    ...projects[0], // Betflow
    category: 'Data Engineering',
  },
  {
    ...projects[1], // GRAG
    category: 'AI',
  },
  {
    ...projects[2], // rsppUnet
    category: ['Deep Learning', 'Research'],
  },
  {
    ...projects[3], // Image-Dehazing
    category: ['Deep Learning'],
  },
] as Array<Project & { category: string | string[] }>;

// Make the page component async for potential server-side operations
export default async function ProjectsPage() {
  // Prepare data on the server
  const initialProjects = categorizedProjects;
  const initialProjectCategories = projectCategories;

  return (
    <>
      <ProjectsClientContent 
        initialProjects={initialProjects}
        initialProjectCategories={initialProjectCategories}
      />
    </>
  );
} 