export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  description?: string;
  content?: string;
  date: string;
  tags: string[];
  category: string[];
  type: 'blog' | 'linkedin' | 'youtube' | 'youtube-video' | 'linkedin-post' | 'quick-note' | 'research-report' | 'comprehensive-study' | 'linkedin-iframe' | 'medium-post';
  link?: string;
  url?: string;
  image?: string;
  thumbnail?: string;
  youtubeUrl?: string;
  author?: {
    name: string;
    avatar: string;
  };
  featured?: boolean;
  readTime?: string;
  embed_link?: string;
  media_link?: string | string[];
  raw_tags?: string[];
  generated_tags?: string[];
  original_title?: string;
  generated_title?: string;
  isPlaceholder?: boolean;
} 