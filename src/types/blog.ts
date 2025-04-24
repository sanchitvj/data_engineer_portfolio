export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  type: 'blog' | 'linkedin' | 'youtube' | 'linkedin-post' | 'quick-note' | 'research-report' | 'comprehensive-study' | 'linkedin-iframe';
  category?: string | string[];
  readTime?: string;
  youtubeUrl?: string;
  thumbnail?: string;
  linkedinUrl?: string;
  image?: string;
  link?: string;
  url?: string;
  embed_link?: string;
  featured?: boolean;
  tags?: string[];
  description?: string;
  author?: {
    name: string;
    avatar: string;
  };
}; 