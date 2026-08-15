'use client';

import React, { useState, useMemo } from 'react';
import { PROJECTS } from '../../src/config/constants';

export const Browser: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo((): string[] => {
    const cats = ['All', ...new Set(PROJECTS.map(p => p.category))];
    return cats;
  }, []);

  const filteredProjects = useMemo(() => {
    let projects = [...PROJECTS];
    if (selectedCategory !== 'All') {
      projects = projects.filter(p => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.techStack?.some(t => t.toLowerCase().includes(query))
      );
    }
    return [...projects].sort((a, b) => (b.featured === a.featured ? 0 : b.featured ? 1 : -1));
  }, [selectedCategory, searchQuery]);

  const stats = useMemo(() => ({
    total: PROJECTS.length,
    featured: PROJECTS.filter(p => p.featured).length,
    categories: categories.length - 1,
    techStack: new Set(PROJECTS.flatMap(p => p.techStack ?? [])).size
  }), []);

  return (
    <div className="h-full flex overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <aside className="w-64 lg:w-72 glass border-r border-[var(--color-border-default)] flex flex-col shrink-0">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))' }}>
              <span className="material-symbols-outlined text-white text-[22px]">code</span>
            </div>
            <div>
              <h2 className="text-h3 text-[var(--color-text-primary)]">Projects</h2>
              <p className="text-caption text-[var(--color-text-tertiary)]">Showcase & GitHub</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl glass border border-[var(--color-border-default)]">
              <p className="text-h2 font-bold text-[var(--color-text-primary)] tabular-nums">{stats.total}</p>
              <p className="text-micro text-[var(--color-text-tertiary)] uppercase tracking-wide">Projects</p>
            </div>
            <div className="p-3 rounded-xl glass border border-[var(--color-border-default)]">
              <p className="text-h2 font-bold text-[var(--color-accent-primary)] tabular-nums">{stats.featured}</p>
              <p className="text-micro text-[var(--color-text-tertiary)] uppercase tracking-wide">Featured</p>
            </div>
            <div className="p-3 rounded-xl glass border border-[var(--color-border-default)]">
              <p className="text-h2 font-bold text-[var(--color-text-primary)] tabular-nums">{stats.categories}</p>
              <p className="text-micro text-[var(--color-text-tertiary)] uppercase tracking-wide">Categories</p>
            </div>
            <div className="p-3 rounded-xl glass border border-[var(--color-border-default)]">
              <p className="text-h2 font-bold text-[var(--color-text-primary)] tabular-nums">{stats.techStack}</p>
              <p className="text-micro text-[var(--color-text-tertiary)] uppercase tracking-wide">Technologies</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 md:p-5 border-b border-[var(--color-border-default)]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          <h3 className="text-micro font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4 px-1">Categories</h3>
          <nav className="flex flex-col gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                  selectedCategory === cat
                    ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/30 shadow-md'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${selectedCategory === cat ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
                  {cat === 'All' ? 'apps' : cat === 'Full Stack' ? 'integration_instructions' : 
                   cat === 'QA & Testing' ? 'bug_report' : cat === 'Web App' ? 'web' : 'phone_android'}
                </span>
                <span className="text-body-sm font-medium">{cat}</span>
                <span className="ml-auto text-micro font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]">
                  {PROJECTS.filter(p => cat === 'All' || p.category === cat).length}
                </span>
              </button>
            ))}
          </nav>

          {/* View Mode */}
          <div className="mt-6 pt-4 border-t border-[var(--color-border-default)]">
            <h3 className="text-micro font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 px-1">View</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/30'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                <span className="text-caption font-medium hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  viewMode === 'list'
                    ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/30'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
                <span className="text-caption font-medium hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer - GitHub Link */}
        <div className="p-4 md:p-5 border-t border-[var(--color-border-default)]">
          <a
            href="https://github.com/abhishekg9630"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full btn btn-primary btn-md"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))', border: 'none' }}
          >
            <span className="material-symbols-outlined text-[20px]">code</span>
            View All on GitHub
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 animate-slide-up">
          <h1 className="text-display text-[var(--color-text-primary)] tracking-tight mb-2">
            Project <span className="text-gradient">Showcase</span>
          </h1>
          <p className="text-body-lg text-[var(--color-text-secondary)] max-w-2xl">
            A curated collection of my work spanning full-stack development, QA automation, and mobile applications. 
            Each project demonstrates commitment to clean code, testing excellence, and user-centric design.
          </p>
        </div>

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 md:mb-6 animate-slide-up stagger-1">
          <p className="text-body-sm text-[var(--color-text-tertiary)]">
            Showing <span className="text-[var(--color-text-primary)] font-semibold">{filteredProjects.length}</span> of <span className="text-[var(--color-text-primary)] font-semibold">{PROJECTS.length}</span> projects
          </p>
          <div className="flex items-center gap-2">
            <span className="text-micro text-[var(--color-text-tertiary)]">Sort:</span>
            <select className="input input-sm w-auto" defaultValue="featured">
              <option value="featured">Featured First</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Projects */}
        {filteredProjects.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-[var(--color-text-tertiary)] flex-col gap-4 animate-fade-in">
            <span className="material-symbols-outlined text-6xl">search_off</span>
            <p className="text-h3">No projects found</p>
            <p className="text-body">Try adjusting your search or category filter</p>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 animate-slide-up stagger-2">
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} delay={index * 40} />
              ))}
            </div>
          ) : (
            <div className="space-y-3 animate-slide-up stagger-2">
              {filteredProjects.map((project, index) => (
                <ProjectListItem key={project.id} project={project} delay={index * 30} />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

interface ProjectCardProps {
  project: import('../../src/types').Project;
  delay: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, delay }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`card card-interactive relative overflow-hidden group animate-slide-up ${
        project.featured ? 'ring-1 ring-[var(--color-accent-primary)]/30' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          {project.featured && (
            <span className="px-2.5 py-1 rounded-full bg-[var(--color-accent-warning)]/20 text-[var(--color-accent-warning)] text-micro font-bold uppercase tracking-wider border border-[var(--color-accent-warning)]/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">star</span>
              Featured
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full glass border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-micro font-medium uppercase tracking-wide">
            {project.category}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn btn-secondary btn-sm"
            >
              <span className="material-symbols-outlined text-[16px]">code</span>
              <span className="hidden sm:inline">Code</span>
            </a>
          )}
          {project.liveDemo && (
            <a
              href={project.liveDemo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn btn-primary btn-sm"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span className="hidden sm:inline">Live Demo</span>
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-h4 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors flex-1 pr-3">
            {project.name}
          </h3>
          <span className="text-micro text-[var(--color-text-tertiary)] whitespace-nowrap">{project.date}</span>
        </div>
        
        <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed mb-4 line-clamp-2">{project.description}</p>
        
        {/* Highlights */}
        {project.highlights && project.highlights.length > 0 && (
          <div className="mb-4 space-y-2">
            {project.highlights.slice(0, 3).map((highlight, i) => (
              <div key={i} className="flex items-start gap-2 text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
                <span className="material-symbols-outlined text-[var(--color-accent-primary)] text-[16px] mt-0.5 shrink-0">check_circle</span>
                <span>{highlight}</span>
              </div>
            ))}
            {project.highlights.length > 3 && (
              <div className="text-[var(--color-accent-primary)] text-caption font-medium">+{project.highlights.length - 3} more</div>
            )}
          </div>
        )}
        
        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {project.techStack.slice(0, 7).map((tech, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-lg glass border border-[var(--color-border-default)] text-caption font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-primary)]/50 transition-all"
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > 7 && (
            <span className="px-2.5 py-1 rounded-lg bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] text-caption font-medium border border-[var(--color-accent-primary)]/30">
              +{project.techStack.length - 7}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProjectListItemProps {
  project: import('../../src/types').Project;
  delay: number;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, delay }) => {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="card card-interactive overflow-hidden animate-slide-up group"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0 overflow-hidden">
          <img
            src={project.image}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-primary)]/80 to-transparent" />
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              {project.featured && (
                <span className="px-2 py-1 rounded-full bg-[var(--color-accent-warning)]/20 text-[var(--color-accent-warning)] text-micro font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[11px]">star</span>
                  Featured
                </span>
              )}
              <span className="px-2 py-1 rounded glass border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-micro font-medium uppercase tracking-wide">
                {project.category}
              </span>
            </div>
            <div className="flex gap-2">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">code</span>
                  Code
                </a>
              )}
              {project.liveDemo && (
                <a
                  href={project.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Demo
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-h4 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors flex-1 pr-3">
                {project.name}
              </h3>
              <span className="text-micro text-[var(--color-text-tertiary)] whitespace-nowrap">{project.date}</span>
            </div>
            
            <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">{project.description}</p>
            
            {/* Highlights */}
            {project.highlights && project.highlights.length > 0 && (
              <div className="mb-4 space-y-2 max-h-24 overflow-hidden">
                {project.highlights.map((highlight, i) => (
                  <div key={i} className="flex items-start gap-2 text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <span className="material-symbols-outlined text-[var(--color-accent-primary)] text-[16px] mt-0.5 shrink-0">check_circle</span>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border-default)]">
            {project.techStack.slice(0, 10).map((tech, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg glass border border-[var(--color-border-default)] text-caption font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-primary)]/50 transition-all"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 10 && (
              <span className="px-3 py-1 rounded-lg bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] text-caption font-medium border border-[var(--color-accent-primary)]/30">
                +{project.techStack.length - 10} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Browser.displayName = 'Browser';