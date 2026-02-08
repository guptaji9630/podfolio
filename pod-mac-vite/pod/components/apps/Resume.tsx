
import React from 'react';

export const Resume: React.FC = () => {
  return (
    <div className="flex flex-1 overflow-hidden bg-[#333]">
      {/* Pages Sidebar */}
      <div className="hidden md:flex w-36 lg:w-44 bg-[#2A2A2A] border-r border-black/30 flex-col overflow-y-auto shrink-0 py-4 px-3 gap-6 select-none">
        <div className="flex flex-col gap-2 cursor-pointer ring-2 ring-primary ring-offset-2 ring-offset-[#2A2A2A] rounded p-1">
          <div className="aspect-[1/1.414] bg-white w-full shadow-md overflow-hidden p-2">
            <div className="w-full h-4 bg-slate-900 mb-2" />
            <div className="w-1/3 h-2 bg-slate-200 mb-4" />
            <div className="w-full h-1 bg-slate-100 mb-1" />
            <div className="w-full h-1 bg-slate-100 mb-1" />
            <div className="w-3/4 h-1 bg-slate-100 mb-6" />
            <div className="w-1/3 h-2 bg-slate-200 mb-2" />
            <div className="w-full h-1 bg-slate-100 mb-1" />
            <div className="w-2/3 h-1 bg-slate-100 mb-1" />
          </div>
          <span className="text-center text-[10px] text-white/90">Page 1</span>
        </div>
        <div className="flex flex-col gap-2 cursor-pointer opacity-50 hover:opacity-100 transition-opacity p-1">
          <div className="aspect-[1/1.414] bg-white w-full shadow-md overflow-hidden p-2">
            <div className="w-1/3 h-2 bg-slate-200 mt-4 mb-2" />
            <div className="w-full h-1 bg-slate-100 mb-1" />
            <div className="w-full h-1 bg-slate-100 mb-1" />
          </div>
          <span className="text-center text-[10px] text-white/60">Page 2</span>
        </div>
      </div>

      {/* Main View */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 flex justify-center bg-[#323232]">
        <div className="bg-white w-full max-w-[600px] md:w-[600px] h-auto md:h-[848px] shadow-2xl shrink-0 flex flex-col">
          {/* Mock PDF Content */}
          <div className="bg-slate-900 text-white p-6 md:p-8">
            <h1 className="text-xl md:text-2xl font-bold">Abhishek Gupta</h1>
            <p className="text-blue-400 text-xs md:text-sm font-medium">Senior Product Designer</p>
          </div>
          <div className="p-6 md:p-10 flex-1 flex flex-col gap-6 md:gap-8 text-slate-800">
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-blue-500 pb-1 mb-3">Professional Profile</h2>
              <p className="text-[11px] md:text-xs leading-relaxed text-slate-600">
                Creative and detail-oriented Senior Product Designer with over 6 years of experience in crafting user-centric digital products...
              </p>
            </section>
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Experience</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span>Lead UX Designer</span>
                    <span className="text-slate-400">2021 - Present</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-bold">TechFlow Solutions</p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">Led a team of 4 designers to overhaul the platform.</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span>Product Designer</span>
                    <span className="text-slate-400">2018 - 2021</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-bold">Creative Pulse Agency</p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">Shipped over 15 projects in Fintech and SaaS.</p>
                </div>
              </div>
            </section>
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest border-b border-slate-200 pb-1 mb-3">Skills</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Design</p>
                  <p className="text-xs">Figma, Sketch, Adobe XD, Photoshop</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Dev</p>
                  <p className="text-xs">React, Tailwind, Node.js, TypeScript</p>
                </div>
              </div>
            </section>
          </div>
          <div className="p-6 text-center text-[9px] text-slate-300">
            Page 1 of 2
          </div>
        </div>
      </div>
    </div>
  );
};
