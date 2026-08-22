
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PROJECTS } from '../../src/config/constants';
import { transitions } from '../../src/types/motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: transitions.springNormal },
  exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.15 } }
};

const sidebarVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { ...transitions.springNormal, delay: 0.1 } }
};

export const Finder: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Projects');
  const filteredProjects = selectedCategory === 'All Projects' ? PROJECTS : PROJECTS.filter(p => p.category === selectedCategory);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-1 overflow-hidden"
    >
      <motion.aside
        variants={sidebarVariants}
        className="hidden sm:flex w-36 md:w-40 lg:w-48 bg-black/20 border-r border-white/5 flex-col pt-4 shrink-0"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-3 md:px-4 mb-4"
        >
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Favorites</h3>
          <motion.nav
            variants={containerVariants}
            className="flex flex-col gap-1"
          >
            {['All Projects', 'Recent', 'Featured'].map((cat, i) => (
              <motion.button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                variants={cardVariants}
                className={`block w-full text-left px-2 py-1.5 text-[11px] md:text-xs rounded-md transition-colors ${selectedCategory === cat ? 'bg-primary text-white shadow-sm' : 'text-gray-300 hover:bg-white/5'}`}
              >
                {cat}
              </motion.button>
            ))}
          </motion.nav>
        </motion.div>
      </motion.aside>
      
      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6"
      >
        {/* Mobile category selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="sm:hidden mb-4"
        >
          <motion.select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            whileFocus={{ boxShadow: '0 0 0 3px rgba(var(--accent-color-rgb, 10, 132, 255), 0.3)' }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All Projects">All Projects</option>
            <option value="Recent">Recent</option>
            <option value="Featured">Featured</option>
          </motion.select>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p, index) => (
              <motion.div
                key={p.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ animationDelay: `${index * 40}ms` }}
                whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
                className="group flex flex-col items-center text-center cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-full aspect-square rounded-lg md:rounded-xl overflow-hidden border border-white/10 shadow-md mb-2"
                >
                  <motion.img
                    src={p.image}
                    className="w-full h-full object-cover transition-transform duration-700"
                    whileHover={{ scale: 1.1 }}
                    alt={p.name}
                  />
                </motion.div>
                <motion.p
                  className="text-[12px] md:text-[13px] font-medium text-white/90 truncate w-full px-1"
                >
                  {p.name}
                </motion.p>
                <motion.p
                  className="text-[10px] md:text-[11px] text-white/40"
                >
                  {p.category}
                </motion.p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {filteredProjects.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="h-full flex items-center justify-center text-white/20 flex-col gap-2"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="material-symbols-outlined text-3xl md:text-4xl"
            >
              folder_off
            </motion.span>
            <p className="text-xs md:text-sm">No items found</p>
          </motion.div>
        )}
      </motion.main>
    </motion.div>
  );
};
