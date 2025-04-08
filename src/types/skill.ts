export interface Skill {
  id: string;
  name: string;
  category: 'Programming' | 'Data' | 'Cloud' | 'Tools' | 'Soft Skills';
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience: number;
  projects: string[]; // Array of project IDs
  description: string;
  icon?: string;
} 