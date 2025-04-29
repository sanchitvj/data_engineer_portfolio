import { MetadataRoute } from 'next';
import { getAllContentItems } from '@/lib/dynamodb';
import { projects } from '@/data/projects';

// Replace with your actual domain
const baseUrl = 'https://penguindb.me';

// Helper function to convert Date to ISO string safely
function toISOString(date: string | Date | undefined): string {
  if (!date) return new Date().toISOString();
  
  try {
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// Extract YouTube video ID from URL
function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  
  // Try to match various YouTube URL patterns
  const patterns = [
    /youtu\.be\/([^?&#]+)/,           // youtu.be/{id}
    /youtube\.com\/watch\?v=([^&#]+)/, // youtube.com/watch?v={id}
    /youtube\.com\/embed\/([^?&#]+)/,  // youtube.com/embed/{id}
    /youtube\.com\/v\/([^?&#]+)/       // youtube.com/v/{id}
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get the current date in ISO format for lastModified
  const currentDate = new Date().toISOString();
  
  // Define static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resume`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/archive`,
      lastModified: currentDate,
      changeFrequency: 'daily', // Archive page changes often as new content is added
      priority: 0.9, // High priority as it contains fresh, updated content
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
  
  // Get dynamic project entries with image metadata
  const projectEntries: MetadataRoute.Sitemap = projects.map(project => {
    // Basic entry
    const entry: any = {
      url: `${baseUrl}/projects/${project.id}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    };
    
    // Add image metadata if project has an image
    if (project.imageUrl) {
      entry.images = [
        {
          url: `${baseUrl}${project.imageUrl}`,
          title: `${project.title} - Project Screenshot`,
          caption: project.description.substring(0, 100) + (project.description.length > 100 ? '...' : ''),
        }
      ];
    }
    
    // Add video metadata if project has a demo URL that's a YouTube link
    if (project.demoUrl && project.demoUrl.includes('youtu')) {
      const videoId = extractYoutubeId(project.demoUrl);
      if (videoId) {
        entry.videos = [
          {
            thumbnail_loc: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            title: `${project.title} - Demo Video`,
            description: project.description.substring(0, 200) + (project.description.length > 200 ? '...' : ''),
            content_loc: project.demoUrl,
            player_loc: `https://www.youtube.com/embed/${videoId}`,
          }
        ];
      }
    }
    
    return entry;
  });
  
  // Get dynamic content entries from DynamoDB with rich media metadata
  let contentEntries: MetadataRoute.Sitemap = [];
  
  try {
    const contentItems = await getAllContentItems();
    
    // Map content items to sitemap entries
    contentEntries = contentItems.map((item: any) => {
      // Generate URL slug based on content type and ID
      let slug = '';
      let changeFreq: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
      let priority = 0.6;
      
      // Set change frequency and priority based on content type
      if (item.content_type === 'article' || item.content_type === 'substack') {
        slug = `archive/${item.content_id || item.slug || item.title?.replace(/\s+/g, '-').toLowerCase()}`;
        changeFreq = 'monthly';
        priority = 0.7;
      } else if (item.content_type === 'post') {
        slug = `archive/${item.content_id || item.slug || item.title?.replace(/\s+/g, '-').toLowerCase()}`;
        changeFreq = 'weekly';
        priority = 0.6;
      } else if (item.content_type === 'youtube') {
        slug = `archive/${item.content_id || item.slug || item.title?.replace(/\s+/g, '-').toLowerCase()}`;
        changeFreq = 'monthly';
        priority = 0.6;
      }
      
      // Only include items with valid slugs
      if (!slug) return null;
      
      // Get last modified date from item or use current date
      const lastModified = toISOString(item.updated_at || item.date_published);
      
      // Create the basic entry
      const entry: any = {
        url: `${baseUrl}/${slug}`,
        lastModified,
        changeFrequency: changeFreq,
        priority,
      };
      
      // Add image metadata if content has media_link (typically an image)
      if (item.media_link && !item.media_link.includes('youtu')) {
        entry.images = [
          {
            url: item.media_link.startsWith('http') ? item.media_link : `${baseUrl}${item.media_link}`,
            title: item.title || 'Content Image',
            caption: item.summary || item.excerpt || (item.title ? `Image for ${item.title}` : 'Content Image'),
          }
        ];
      }
      
      // Add video metadata for YouTube content
      if ((item.content_type === 'youtube' || item.url?.includes('youtu')) && item.url) {
        const videoId = extractYoutubeId(item.url);
        if (videoId) {
          entry.videos = [
            {
              thumbnail_loc: item.media_link || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              title: item.title || 'YouTube Video',
              description: item.summary || item.excerpt || 'YouTube Video Content',
              content_loc: item.url,
              player_loc: `https://www.youtube.com/embed/${videoId}`,
            }
          ];
        }
      }
      
      return entry;
    }).filter(Boolean) as MetadataRoute.Sitemap;
  } catch (error) {
    console.error('Error generating dynamic content sitemap entries:', error);
    // Continue with static entries if there's an error
  }
  
  // Combine all entries and return
  return [...staticPages, ...projectEntries, ...contentEntries];
} 