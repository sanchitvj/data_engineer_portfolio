export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  type: 'blog' | 'linkedin' | 'youtube' | 'youtube-video' | 'linkedin-post' | 'quick-note' | 'research-report' | 'comprehensive-study' | 'linkedin-iframe';
  category?: string | string[];
  readTime?: string;
  youtubeUrl?: string;
  thumbnail?: string;
  linkedinUrl?: string;
  image?: string;
  link?: string;
  url?: string;
  embed_link?: string;
  media_link?: string | string[];
  featured?: boolean;
  tags?: string[];
  description?: string;
  author?: {
    name: string;
    avatar: string;
  };
  isPlaceholder?: boolean;
  generated_tags?: string[];
}; 