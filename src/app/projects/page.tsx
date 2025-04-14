// Import new client component and data for projects
import { projects } from '@/data/projects';
import ProjectsClientContent from '@/components/projects/ProjectsClientContent';
import { Project } from '@/types/project';

// Define project categories
const projectCategories = [
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
  // {
  //   ...projects[4], // Confidential Project
  //   category: 'Data Engineering',
  // }
] as Array<Project & { category: string | string[] }>;

// Make the page component async for potential server-side operations
export default async function ProjectsPage() {
  // Prepare data on the server
  const initialProjects = categorizedProjects;
  const initialProjectCategories = projectCategories;

  return (
    <ProjectsClientContent 
      initialProjects={initialProjects}
      initialProjectCategories={initialProjectCategories}
    />
  );
} 