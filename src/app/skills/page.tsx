'use client';

import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import SkillCard from '../../components/skills/SkillCard';
import { skills } from '../../data/skills';
import { Skill } from '../../types/skill';

export default function SkillsPage() {
  const [selectedCategory, setSelectedCategory] = useState<Skill['category'] | 'All'>('All');
  const [selectedProficiency, setSelectedProficiency] = useState<Skill['proficiency'] | 'All'>('All');

  const categories = ['All', ...new Set(skills.map((skill) => skill.category))];
  const proficiencies = ['All', ...new Set(skills.map((skill) => skill.proficiency))];

  const filteredSkills = skills.filter((skill) => {
    if (selectedCategory !== 'All' && skill.category !== selectedCategory) return false;
    if (selectedProficiency !== 'All' && skill.proficiency !== selectedProficiency) return false;
    return true;
  });

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Skills</h1>

        <div className="mb-8 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Skill['category'] | 'All')}
              className="rounded-md border bg-background px-3 py-2"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Proficiency</label>
            <select
              value={selectedProficiency}
              onChange={(e) => setSelectedProficiency(e.target.value as Skill['proficiency'] | 'All')}
              className="rounded-md border bg-background px-3 py-2"
            >
              {proficiencies.map((proficiency) => (
                <option key={proficiency} value={proficiency}>
                  {proficiency}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      </div>
    </MainLayout>
  );
} 