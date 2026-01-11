import React, { useState, useEffect } from 'react';
import { useMailComposer } from '../../src/hooks/useMailComposer';

export const Mail: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'composer'>(
    window.innerWidth < 1024 ? 'list' : 'composer'
  );
  const { formState, updateField, sendEmail, reset } = useMailComposer();

  // Show success notification
  useEffect(() => {
    if (formState.success) {
      setTimeout(() => reset(), 3000);
    }
  }, [formState.success, reset]);

  const handleSend = async () => {
    if (formState.isSubmitting) return;
    await sendEmail();
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-12 md:w-56 bg-black/20 border-r border-white/5 flex flex-col pt-4 shrink-0">
        <nav className="flex flex-col gap-0.5 px-1 md:px-2">
          <button className="flex items-center gap-3 px-2 md:px-3 py-1.5 rounded-md bg-primary text-white w-full">
            <span className="material-symbols-outlined text-[20px] fill-current">inbox</span>
            <span className="text-sm font-medium hidden md:block">Inbox</span>
          </button>
          <button className="flex items-center gap-3 px-2 md:px-3 py-1.5 rounded-md text-white/70 hover:bg-white/5 w-full">
            <span className="material-symbols-outlined text-[20px]">send</span>
            <span className="text-sm font-medium hidden md:block">Sent</span>
          </button>
        </nav>
      </div>

      {/* Message List */}
      <div
        className={`${
          currentView === 'composer' ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-72 bg-black/10 border-r border-white/5 flex-col shrink-0`}
      >
        <div className="p-3 border-b border-white/5 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white leading-tight">Inbox</span>
            <span className="text-xs text-white/50">2 messages</span>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          <div
            onClick={() => setCurrentView('composer')}
            className="px-4 py-3 border-b border-white/5 bg-white/5 border-l-[3px] border-l-primary cursor-pointer"
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-white font-semibold text-sm truncate pr-2">Contact Abhishek</h3>
              <span className="text-xs text-white/40">Now</span>
            </div>
            <p className="text-xs text-white/80 font-medium truncate">New Message</p>
            <p className="text-xs text-white/50 line-clamp-2">Send a message to Abhishek</p>
          </div>
          <div className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-white font-medium text-sm">Sid Pandey</h3>
              <span className="text-xs text-white/40">Yesterday</span>
            </div>
            <p className="text-xs text-white/70 mb-1 truncate">Feedback: Great Work</p>
            <p className="text-xs text-white/50 line-clamp-2">
              The work exceeded our expectations...
            </p>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div
        className={`${
          currentView === 'list' ? 'hidden lg:flex' : 'flex'
        } flex-1 bg-[#1e1e1e] flex flex-col`}
      >
        {/* Success/Error Messages */}
        {formState.success && (
          <div className="bg-green-500/20 border-b border-green-500/30 px-4 py-2 text-green-300 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Message sent successfully!
          </div>
        )}
        {formState.error && (
          <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 text-red-300 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {formState.error}
          </div>
        )}

        <div className="flex flex-col shrink-0">
          <div className="flex items-center px-4 py-2 border-b border-white/5">
            {window.innerWidth < 1024 && (
              <button onClick={() => setCurrentView('list')} className="mr-4 text-primary">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
            )}
            <label className="text-white/50 text-sm font-medium w-12 md:w-16 text-right mr-4">
              To:
            </label>
            <span className="bg-primary/20 text-blue-300 px-2 py-0.5 rounded text-xs md:text-sm border border-primary/30 flex items-center gap-1">
              abhishekg9630@gmail.com
            </span>
          </div>

          {/* Optional Sender Info */}
          <div className="flex items-center px-4 py-2 border-b border-white/5">
            <label className="text-white/50 text-sm font-medium w-12 md:w-16 text-right mr-4">
              From:
            </label>
            <input
              className="bg-transparent border-none p-0 text-sm text-white focus:ring-0 placeholder-white/30 flex-1 mr-2"
              placeholder="Your email (optional)"
              value={formState.senderEmail}
              onChange={e => updateField('senderEmail', e.target.value)}
              disabled={formState.isSubmitting}
            />
          </div>

          <div className="flex items-center px-4 py-2 border-b border-white/5">
            <label className="text-white/50 text-sm font-medium w-12 md:w-16 text-right mr-4">
              Subject:
            </label>
            <input
              className="bg-transparent border-none p-0 text-sm font-medium text-white focus:ring-0 placeholder-white/20 w-full"
              placeholder="Project Inquiry"
              value={formState.subject}
              onChange={e => updateField('subject', e.target.value)}
              disabled={formState.isSubmitting}
            />
          </div>
        </div>

        <div className="flex-1 relative">
          <textarea
            className="w-full h-full bg-transparent border-none p-4 md:p-6 text-sm md:text-base leading-relaxed text-white/90 placeholder-white/30 resize-none focus:ring-0"
            placeholder="Hi Abhishek, I'd like to talk about..."
            value={formState.message}
            onChange={e => updateField('message', e.target.value)}
            disabled={formState.isSubmitting}
          />
        </div>

        <div className="h-10 border-t border-white/5 bg-[#252525] flex items-center px-4 gap-4 shrink-0">
          <span className="material-symbols-outlined text-[18px] text-white/40 cursor-pointer hover:text-white">
            format_bold
          </span>
          <span className="material-symbols-outlined text-[18px] text-white/40 cursor-pointer hover:text-white shrink-0">
            attach_file
          </span>
          <div className="flex-1" />
          <button
            onClick={handleSend}
            disabled={formState.isSubmitting || !formState.subject || !formState.message}
            className="bg-primary text-white text-[10px] md:text-xs font-bold px-3 md:px-4 py-1 rounded shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {formState.isSubmitting && (
              <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
            )}
            {formState.isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
