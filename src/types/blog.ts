export interface BlogPost {
  id: string;
  title: string;
  excerpt?: string;
  description?: string;
  content?: string;
  date: string;
  readTime: string;
  category: string | string[];
  type?: 'linkedin-post' | 'quick-note' | 'research-report' | 'comprehensive-study' | 'linkedin-iframe';
  link?: string;
  url?: string;
  image?: string;
  featured?: boolean;
  tags?: string[];
  author?: {
    name: string;
    avatar: string;
  };
  embed_link?: string | null;
} 