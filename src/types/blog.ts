export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string | string[];
  type: 'linkedin-post' | 'quick-note' | 'research-report' | 'comprehensive-study';
  link: string;
  image?: string;
  featured?: boolean;
} 