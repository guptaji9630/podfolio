
import React from 'react';

export const AboutMe: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto bg-black/40 scroll-smooth">
      <div className="p-6 md:p-8 pb-6 border-b border-white/5">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-center md:text-left">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-white/5 shadow-2xl relative mx-auto">
              <div className="absolute inset-0 bg-black/10 z-10" />
              <img 
                alt="Portrait of Abhishek Gupta" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZKuspfKMCIjla9em5-yyL0L2JfCUWziWNGGWvJWKAYRTFNXklC2yFMRfQSl2eA2IgjAZTKxuTdOvn6fvvDk6isxUb2USGnrC4xQryummw_OzWRHIaqGDdee3EeVUNTFPVDd1zpd5kwW0rxncdqE8t0sNoHVkgh9IY5xhaKNHK7egj8pXtDWtDk3OGTF1h3vGUxLDIMLYRXcIjCWsPimCIVP2xBvSo0EdVUSn4lsSioNlOCBUgWYMhzbS8S8R0jqKdXlm-SUYHvl8m" 
              />
            </div>
            <div className="absolute bottom-1 right-2 md:right-3 bg-green-500 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-[#1c1c1e] z-20 shadow-md" />
          </div>
          <div className="pt-1 flex-1">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white mb-1">Hello, I'm Abhishek</h1>
            <p className="text-base md:text-lg text-blue-400 font-medium mb-3">Software Engineer & Tester</p>
            <p className="text-gray-400 max-w-xl leading-relaxed text-xs md:text-sm mb-4 font-light mx-auto md:mx-0">
               I am a software engineer with a strong background in testing and quality assurance. I have experience in developing and maintaining software applications, and I am passionate about creating innovative and user-friendly solutions.
            </p>
            <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
              {['UI/UX', 'React', 'Tailwind', 'Node.js'].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#3a3a3c] border border-white/10 text-gray-300 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {[
          { icon: 'calendar_month', label: 'Experience', value: '2 Years', color: 'bg-blue-500/20 text-blue-400' },
          { icon: 'rocket_launch', label: 'Shipped', value: '3+ Projects', color: 'bg-purple-500/20 text-purple-400' },
          { icon: 'sentiment_satisfied', label: 'Clients', value: '2+ Happy', color: 'bg-emerald-500/20 text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#2c2c2e]/60 border border-white/5 p-4 rounded-xl hover:bg-[#3a3a3c]/60 transition-colors cursor-default backdrop-blur-sm shadow-sm flex sm:flex-col items-center sm:items-start gap-4 sm:gap-0">
            <div className="flex items-center gap-3 mb-0 sm:mb-2">
              <div className={`p-1.5 rounded-md ${stat.color}`}>
                <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide hidden sm:inline">{stat.label}</span>
            </div>
            <div className="flex flex-col sm:block">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide sm:hidden">{stat.label}</span>
              <div className="text-xl md:text-2xl font-bold text-white sm:pl-1">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 md:p-8 pt-2">
        <h2 className="text-xs font-bold text-gray-300 mb-4 uppercase tracking-wider">Latest Activity</h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-1 h-10 bg-blue-500 rounded-full shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-white font-medium">Released Version 2.0 of Fintech Dashboard</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">3 days ago • Web Dev</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="w-1 h-10 bg-purple-500 rounded-full shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-white font-medium">Started new branding for Coffee Roasters</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase">1 week ago • Brand Identity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
