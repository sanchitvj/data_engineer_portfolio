'use client';

import React from 'react';
import { Skill } from '../../types/skill';
import Link from 'next/link';

interface SkillCardProps {
  skill: Skill;
}

export default function SkillCard({ skill }: SkillCardProps) {
  const getProficiencyColor = (proficiency: Skill['proficiency']) => {
    switch (proficiency) {
      case 'Expert':
        return 'bg-green-500/20 text-green-500';
      case 'Advanced':
        return 'bg-blue-500/20 text-blue-500';
      case 'Intermediate':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'Beginner':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getCategoryColor = (category: Skill['category']) => {
    switch (category) {
      case 'Programming':
        return 'bg-purple-500/20 text-purple-500';
      case 'Data':
        return 'bg-blue-500/20 text-blue-500';
      case 'Cloud':
        return 'bg-orange-500/20 text-orange-500';
      case 'Tools':
        return 'bg-green-500/20 text-green-500';
      case 'Soft Skills':
        return 'bg-pink-500/20 text-pink-500';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };

  return (
    <div className="rounded-lg border bg-background p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {skill.icon && (
            <img
              src={`/images/skills/${skill.icon}`}
              alt={skill.name}
              className="h-8 w-8"
            />
          )}
          <h3 className="text-xl font-semibold">{skill.name}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}>
          {skill.proficiency}
        </span>
      </div>
      
      <div className="mt-4">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryColor(skill.category)}`}>
          {skill.category}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">
          {skill.yearsOfExperience} years of experience
        </p>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {skill.description}
      </p>
    </div>
  );
} 