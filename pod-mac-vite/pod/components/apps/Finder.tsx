
'use client';

import React, { useState } from 'react';
import { PROJECTS } from '../../constants';

export const Finder: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Projects');
  const filteredProjects = selectedCategory === 'All Projects' ? PROJECTS : PROJECTS.filter(p => p.category === selectedCategory);

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="hidden sm:flex w-36 md:w-40 lg:w-48 bg-black/20 border-r border-white/5 flex-col pt-4 shrink-0">
        <div className="px-3 md:px-4 mb-4">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Favorites</h3>
          <nav className="flex flex-col gap-1">
            {['All Projects', 'Recent', 'Featured'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`block w-full text-left px-2 py-1.5 text-[11px] md:text-xs rounded-md transition-colors ${selectedCategory === cat ? 'bg-primary text-white shadow-sm' : 'text-gray-300 hover:bg-white/5'}`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
        {/* Mobile category selector */}
        <div className="sm:hidden mb-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All Projects">All Projects</option>
            <option value="Recent">Recent</option>
            <option value="Featured">Featured</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredProjects.map(p => (
            <div key={p.id} className="group flex flex-col items-center text-center cursor-default">
              <div className="w-full aspect-square rounded-lg md:rounded-xl overflow-hidden border border-white/10 shadow-md mb-2 group-hover:border-white/30 transition-all">
                <img 
                  src={p.image} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={p.name}
                />
              </div>
              <p className="text-[12px] md:text-[13px] font-medium text-white/90 truncate w-full px-1">{p.name}</p>
              <p className="text-[10px] md:text-[11px] text-white/40">{p.category}</p>
            </div>
          ))}
        </div>
        {filteredProjects.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/20 flex-col gap-2">
            <span className="material-symbols-outlined text-3xl md:text-4xl">folder_off</span>
            <p className="text-xs md:text-sm">No items found</p>
          </div>
        )}
      </main>
    </div>
  );
};
