'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PROJECTS } from '../../src/config/constants';
import { transitions } from '../../src/types/motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: transitions.springNormal },
  exit: { opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }
};

const listItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: transitions.springNormal },
  exit: { opacity: 0, x: 20, transition: { duration: 0.15 } }
};

const sidebarVariants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { ...transitions.springNormal, delay: 0.1 } }
};

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

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'All': return 'apps';
      case 'Full Stack': return 'integration_instructions';
      case 'QA & Testing': return 'bug_report';
      case 'Web App': return 'web';
      default: return 'phone_android';
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="h-full flex overflow-hidden bg-[var(--color-bg-primary)]"
    >
      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        className="w-64 lg:w-72 glass border-r border-[var(--color-border-default)] flex flex-col shrink-0"
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-3 mb-5">
            <motion.div
              animate={{ rotate: [0, 0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))' }}
            >
              <span className="material-symbols-outlined text-white text-[22px]">code</span>
            </motion.div>
            <div>
              <h2 className="text-h3 text-[var(--color-text-primary)]">Projects</h2>
              <p className="text-caption text-[var(--color-text-tertiary)]">Showcase & GitHub</p>
            </div>
          </div>
          
          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            variants={containerVariants}
          >
            {[
              { label: 'Projects', value: stats.total, color: 'var(--color-text-primary)' },
              { label: 'Featured', value: stats.featured, color: 'var(--color-accent-primary)' },
              { label: 'Categories', value: stats.categories, color: 'var(--color-text-primary)' },
              { label: 'Technologies', value: stats.techStack, color: 'var(--color-text-primary)' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1, transition: { delay: 0.2 + i * 0.05, type: 'spring', stiffness: 400, damping: 35 } }}
                whileHover={{ y: -2, scale: 1.02 }}
                className="p-3 rounded-xl glass border border-[var(--color-border-default)]"
              >
                <p className="text-h2 font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-micro text-[var(--color-text-tertiary)] uppercase tracking-wide">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 md:p-5 border-b border-[var(--color-border-default)]"
        >
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] text-[18px]">search</span>
            <motion.input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              whileFocus={{ boxShadow: '0 0 0 3px rgba(var(--accent-color-rgb, 10, 132, 255), 0.3)' }}
              className="input w-full pl-10"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-1 overflow-y-auto p-4 md:p-5"
        >
          <h3 className="text-micro font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4 px-1">Categories</h3>
          <motion.nav
            variants={containerVariants}
            className="flex flex-col gap-1"
          >
            {categories.map((cat, i) => (
              <motion.button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variants={cardVariants}
                className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                  selectedCategory === cat
                    ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/30 shadow-md'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <motion.span
                  animate={{ scale: selectedCategory === cat ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`material-symbols-outlined text-[18px] ${selectedCategory === cat ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)]'}`}
                >
                  {getCategoryIcon(cat)}
                </motion.span>
                <span className="text-body-sm font-medium">{cat}</span>
                <motion.span
                  className="ml-auto text-micro font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]"
                >
                  {PROJECTS.filter(p => cat === 'All' || p.category === cat).length}
                </motion.span>
              </motion.button>
            ))}
          </motion.nav>

          {/* View Mode */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 pt-4 border-t border-[var(--color-border-default)]"
          >
            <h3 className="text-micro font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 px-1">View</h3>
            <motion.div className="flex gap-2">
              {['grid', 'list'].map((mode) => (
                <motion.button
                  key={mode}
                  onClick={() => setViewMode(mode as 'grid' | 'list')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl transition-all ${
                    viewMode === mode
                      ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/30'
                      : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                  }`}
                >
                  <motion.span
                    animate={{ rotate: viewMode === mode ? 360 : 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="material-symbols-outlined text-[18px]"
                  >
                    {mode === 'grid' ? 'grid_view' : 'view_list'}
                  </motion.span>
                  <span className="text-caption font-medium hidden sm:inline">{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Footer - GitHub Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 md:p-5 border-t border-[var(--color-border-default)]"
        >
          <motion.a
            href="https://github.com/abhishekg9630"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 w-full btn btn-primary btn-md"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))', border: 'none' }}
          >
            <span className="material-symbols-outlined text-[20px]">code</span>
            View All on GitHub
          </motion.a>
        </motion.div>
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 md:mb-8"
        >
          <h1 className="text-display text-[var(--color-text-primary)] tracking-tight mb-2">
            Project <span className="text-gradient">Showcase</span>
          </h1>
          <p className="text-body-lg text-[var(--color-text-secondary)] max-w-2xl">
            A curated collection of my work spanning full-stack development, QA automation, and mobile applications. 
            Each project demonstrates commitment to clean code, testing excellence, and user-centric design.
          </p>
        </motion.div>

        {/* Results Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 md:mb-6"
        >
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
        </motion.div>

        {/* Projects */}
        <AnimatePresence mode="popLayout">
          {filteredProjects.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-[400px] flex items-center justify-center text-[var(--color-text-tertiary)] flex-col gap-4"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="material-symbols-outlined text-6xl"
              >
                search_off
              </motion.span>
              <p className="text-h3">No projects found</p>
              <p className="text-body">Try adjusting your search or category filter</p>
            </motion.div>
          ) : (
            viewMode === 'grid' ? (
              <motion.div
                key="grid"
                variants={containerVariants}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"
              >
                {filteredProjects.map((project, index) => (
                  <ProjectCard key={project.id} project={project} delay={index * 40} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={containerVariants}
                className="space-y-3"
              >
                {filteredProjects.map((project, index) => (
                  <ProjectListItem key={project.id} project={project} delay={index * 30} />
                ))}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </motion.main>
    </motion.div>
  );
};

interface ProjectCardProps {
  project: import('../../src/types').Project;
  delay: number;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, delay }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      style={{ animationDelay: `${delay}ms` }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ y: -4, boxShadow: 'var(--shadow-xl)' }}
      className={`card card-interactive relative overflow-hidden group ${
        project.featured ? 'ring-1 ring-[var(--color-accent-primary)]/30' : ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <motion.img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-700"
          whileHover={{ scale: 1.08 }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-primary)]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between">
          {project.featured && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="px-2.5 py-1 rounded-full bg-[var(--color-accent-warning)]/20 text-[var(--color-accent-warning)] text-micro font-bold uppercase tracking-wider border border-[var(--color-accent-warning)]/30 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[12px]">star</span>
              Featured
            </motion.span>
          )}
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="px-2.5 py-1 rounded-full glass border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-micro font-medium uppercase tracking-wide"
          >
            {project.category}
          </motion.span>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-3 right-3 flex gap-2"
        >
          {project.githubUrl && (
            <motion.a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 btn btn-secondary btn-sm"
            >
              <span className="material-symbols-outlined text-[16px]">code</span>
              <span className="hidden sm:inline">Code</span>
            </motion.a>
          )}
          {project.liveDemo && (
            <motion.a
              href={project.liveDemo}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 btn btn-primary btn-sm"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span className="hidden sm:inline">Live Demo</span>
            </motion.a>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <motion.h3
            whileHover={{ color: 'var(--color-accent-primary)' }}
            className="text-h4 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors flex-1 pr-3"
          >
            {project.name}
          </motion.h3>
          <span className="text-micro text-[var(--color-text-tertiary)] whitespace-nowrap">{project.date}</span>
        </div>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed mb-4 line-clamp-2"
        >
          {project.description}
        </motion.p>
        
        {/* Highlights */}
        {project.highlights && project.highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 space-y-2"
          >
            {project.highlights.slice(0, 3).map((highlight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-body-sm text-[var(--color-text-secondary)] leading-relaxed"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="material-symbols-outlined text-[var(--color-accent-primary)] text-[16px] mt-0.5 shrink-0"
                >
                  check_circle
                </motion.span>
                <span>{highlight}</span>
              </motion.div>
            ))}
            {project.highlights.length > 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[var(--color-accent-primary)] text-caption font-medium"
              >
                +{project.highlights.length - 3} more
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          {project.techStack.slice(0, 7).map((tech, i) => (
            <motion.span
              key={i}
              whileHover={{ scale: 1.05, y: -1, borderColor: 'var(--color-accent-primary)' }}
              className="px-2.5 py-1 rounded-lg glass border border-[var(--color-border-default)] text-caption font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-primary)]/50 transition-all"
            >
              {tech}
            </motion.span>
          ))}
          {project.techStack.length > 7 && (
            <span className="px-2.5 py-1 rounded-lg bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] text-caption font-medium border border-[var(--color-accent-primary)]/30">
              +{project.techStack.length - 7}
            </span>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

interface ProjectListItemProps {
  project: import('../../src/types').Project;
  delay: number;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ project, delay }) => {
  return (
    <motion.div
      style={{ animationDelay: `${delay}ms` }}
      variants={listItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={{ x: 4, boxShadow: 'var(--shadow-lg)' }}
      className="card card-interactive overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-72 lg:w-80 flex-shrink-0 overflow-hidden">
          <motion.img
            src={project.image}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500"
            whileHover={{ scale: 1.05 }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-primary)]/80 to-transparent" />
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              {project.featured && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="px-2 py-1 rounded-full bg-[var(--color-accent-warning)]/20 text-[var(--color-accent-warning)] text-micro font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[11px]">star</span>
                  Featured
                </motion.span>
              )}
              <span className="px-2 py-1 rounded glass border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-micro font-medium uppercase tracking-wide">
                {project.category}
              </span>
            </div>
            <div className="flex gap-2">
              {project.githubUrl && (
                <motion.a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-secondary btn-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">code</span>
                  Code
                </motion.a>
              )}
              {project.liveDemo && (
                <motion.a
                  href={project.liveDemo}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary btn-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Demo
                </motion.a>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <motion.h3
                whileHover={{ color: 'var(--color-accent-primary)' }}
                className="text-h4 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors flex-1 pr-3"
              >
                {project.name}
              </motion.h3>
              <span className="text-micro text-[var(--color-text-tertiary)] whitespace-nowrap">{project.date}</span>
            </div>
            
            <motion.p
              className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed mb-4"
            >
              {project.description}
            </motion.p>
            
            {/* Highlights */}
            {project.highlights && project.highlights.length > 0 && (
              <motion.div
                className="mb-4 space-y-2 max-h-24 overflow-hidden"
              >
                {project.highlights.map((highlight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2 text-body-sm text-[var(--color-text-secondary)] leading-relaxed"
                  >
                    <span className="material-symbols-outlined text-[var(--color-accent-primary)] text-[16px] mt-0.5 shrink-0">check_circle</span>
                    <span>{highlight}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-border-default)]"
          >
            {project.techStack.slice(0, 10).map((tech, i) => (
              <motion.span
                key={i}
                whileHover={{ scale: 1.05, y: -1, borderColor: 'var(--color-accent-primary)' }}
                className="px-3 py-1 rounded-lg glass border border-[var(--color-border-default)] text-caption font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-primary)]/50 transition-all"
              >
                {tech}
              </motion.span>
            ))}
            {project.techStack.length > 10 && (
              <span className="px-3 py-1 rounded-lg bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] text-caption font-medium border border-[var(--color-accent-primary)]/30">
                +{project.techStack.length - 10} more
              </span>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

Browser.displayName = 'Browser';