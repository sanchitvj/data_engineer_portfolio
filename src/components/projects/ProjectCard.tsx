'use client';

import React from 'react';
import Link from 'next/link';
import { Project } from '../../types/project';
import { ExternalLink, Github } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background p-2">
      <div className="aspect-video overflow-hidden rounded-md">
        <img
          src={project.imageUrl}
          alt={project.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold">{project.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {project.shortDescription}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View Details
          </Link>
          <div className="flex gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 