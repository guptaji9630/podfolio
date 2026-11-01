
import React from 'react';
import { motion } from 'motion/react';
import { transitions } from '../../src/types/motion';
import { resume } from '../../src/data/resume';

const sectionVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: transitions.springNormal }
};

const itemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: transitions.springNormal }
};

const sidebarVariants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { ...transitions.springNormal, delay: 0.1 } }
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: transitions.springNormal }
};

export const Resume: React.FC = () => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const downloadingRef = React.useRef(false);

  const handleDownloadPDF = async () => {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { createResumePDF } = await import('../../src/utils/resumePdf');
      await createResumePDF().save(resume.filename, { returnPromise: true });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setDownloadError('PDF download failed. Please try again.');
    } finally {
      downloadingRef.current = false;
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 overflow-hidden bg-[#333]"
    >
      {/* Pages Sidebar */}
      <motion.div
        variants={sidebarVariants}
        className="hidden md:flex w-36 lg:w-44 bg-[#2A2A2A] border-r border-black/30 flex-col overflow-y-auto shrink-0 py-4 px-3 gap-6 select-none"
      >
        <motion.button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <motion.span
            animate={{ rotate: isDownloading ? 360 : 0 }}
            transition={{ duration: 1, repeat: isDownloading ? Infinity : 0, ease: 'linear' }}
            className="material-symbols-outlined text-[16px]"
          >
            {isDownloading ? 'hourglass_empty' : 'download'}
          </motion.span>
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </motion.button>
        
        <motion.div
          variants={cardVariants}
          whileHover={{ scale: 1.03, boxShadow: 'var(--shadow-xl)' }}
          className="flex flex-col gap-2 cursor-pointer ring-2 ring-primary ring-offset-2 ring-offset-[#2A2A2A] rounded p-1"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="aspect-[1/1.414] bg-white w-full shadow-md overflow-hidden p-2"
          >
            <div className="w-full h-4 bg-slate-900 mb-2" />
            <div className="w-1/3 h-2 bg-slate-200 mb-4" />
            <div className="w-full h-1 bg-slate-100 mb-1" />
            <div className="w-full h-1 bg-slate-100 mb-1" />
            <div className="w-3/4 h-1 bg-slate-100 mb-6" />
            <div className="w-1/3 h-2 bg-slate-200 mb-2" />
            <div className="w-full h-1 bg-slate-100 mb-1" />
            <div className="w-2/3 h-1 bg-slate-100 mb-1" />
          </motion.div>
          <span className="text-center text-[10px] text-white/90">Page 1</span>
        </motion.div>
      </motion.div>

      {/* Main View */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 flex flex-col items-center bg-[#323232]"
      >
        {/* Mobile Download Button */}
        <motion.button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="md:hidden mb-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg w-full max-w-[600px]"
        >
          <motion.span
            animate={{ rotate: isDownloading ? 360 : 0 }}
            transition={{ duration: 1, repeat: isDownloading ? Infinity : 0, ease: 'linear' }}
            className="material-symbols-outlined text-[18px]"
          >
            {isDownloading ? 'hourglass_empty' : 'download'}
          </motion.span>
          {isDownloading ? 'Generating PDF...' : 'Download PDF'}
        </motion.button>

        {downloadError && (
          <p role="alert" className="mb-4 max-w-[600px] text-sm text-red-300">
            {downloadError}
          </p>
        )}

        <motion.div
          data-resume-content
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 35 }}
          className="bg-white w-full max-w-[600px] md:w-[600px] shadow-2xl shrink-0 flex flex-col font-sans"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900 text-white p-6 md:p-8 border-b-4 border-primary"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl md:text-3xl font-bold tracking-tight"
            >
              {resume.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-primary text-sm md:text-base font-semibold mt-1"
            >
              {resume.headline}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-slate-400 mt-2"
            >
              {resume.location}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap gap-4 mt-4 text-[10px] md:text-xs text-slate-300"
            >
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="material-symbols-outlined text-[14px]"
                >
                  mail
                </motion.span>
                <span>{resume.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="material-symbols-outlined text-[14px]"
                >
                  call
                </motion.span>
                <span>{resume.phone}</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-6 md:p-8 flex-1 flex flex-col gap-5 md:gap-6 text-slate-800"
          >
            {/* Professional Summary */}
            <motion.section
              variants={sectionVariants}
              className="space-y-3"
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-primary pb-1 mb-3 text-slate-900"
              >
                Professional Summary
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] md:text-[11px] leading-relaxed text-slate-700"
              >
                {resume.summary}
              </motion.p>
            </motion.section>

            {/* Skills */}
            <motion.section
              variants={sectionVariants}
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900"
              >
                Technical Skills
              </motion.h2>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
                variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
              >
                {resume.skills.map((skill) => (
                  <motion.div key={skill.label} variants={itemVariants}>
                    <motion.h4
                      className="text-[9px] md:text-[10px] font-bold text-primary uppercase mb-1.5"
                    >
                      {skill.label}
                    </motion.h4>
                    <motion.p
                      className="text-[9px] md:text-[10px] text-slate-700 leading-relaxed"
                    >
                      {skill.skills}
                    </motion.p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Experience */}
            <motion.section
              variants={sectionVariants}
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900"
              >
                Professional Experience
              </motion.h2>
              <motion.div
                className="space-y-4"
                variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
              >
                {resume.experience.map((exp) => (
                  <motion.div key={exp.title} variants={itemVariants}>
                    <div className="flex justify-between items-start mb-1">
                      <motion.h3
                        whileHover={{ color: 'var(--color-accent-primary)' }}
                        className="text-[11px] md:text-xs font-bold text-slate-900"
                      >
                        {exp.title}
                      </motion.h3>
                      <span className="text-[9px] md:text-[10px] text-slate-500 font-medium whitespace-nowrap">{exp.period}</span>
                    </div>
                    <motion.p
                      className="text-[10px] text-primary font-bold mb-2"
                    >
                      {exp.company}
                    </motion.p>
                    <ul className="text-[9px] md:text-[10px] text-slate-600 space-y-1 ml-4 list-disc">
                      {exp.items.map((item, j) => (
                        <motion.li key={j} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: j * 0.05 }}>
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Projects */}
            <motion.section
              variants={sectionVariants}
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900"
              >
                Selected Projects
              </motion.h2>
              <motion.div className="space-y-3" variants={{ animate: { transition: { staggerChildren: 0.05 } } }}>
                {resume.projects.map((proj) => (
                  <motion.div key={proj.title} variants={itemVariants}>
                    <motion.h3
                      whileHover={{ color: 'var(--color-accent-primary)' }}
                      className="text-[11px] md:text-xs font-bold text-slate-900"
                    >
                      {proj.title}
                    </motion.h3>
                    <ul className="text-[9px] md:text-[10px] text-slate-600 space-y-1 ml-4 list-disc mt-1">
                      {proj.items.map((item, j) => (
                        <motion.li key={j} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: j * 0.05 }}>
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Education */}
            <motion.section
              variants={sectionVariants}
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900"
              >
                Education
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[11px] md:text-xs font-bold text-slate-900">{resume.education.degree}</h3>
                    <p className="text-[10px] text-primary font-semibold">{resume.education.institution}</p>
                    <p className="text-[9px] md:text-[10px] text-slate-500">{resume.education.location} • {resume.education.grade}</p>
                  </div>
                  <span className="text-[9px] md:text-[10px] text-slate-500 font-medium whitespace-nowrap">{resume.education.period}</span>
                </div>
              </motion.div>
            </motion.section>

            {/* Additional Information */}
            <motion.section
              variants={sectionVariants}
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900"
              >
                Additional Information
              </motion.h2>
              <motion.div className="space-y-2" variants={{ animate: { transition: { staggerChildren: 0.05 } } }}>
                {resume.additional.map((info) => (
                  <motion.div key={info.label} variants={itemVariants}>
                    <motion.h4 className="text-[9px] md:text-[10px] font-bold text-slate-900">{info.label}</motion.h4>
                    <motion.p className="text-[9px] md:text-[10px] text-slate-700">{info.value}</motion.p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-4 text-center text-[9px] text-slate-400 border-t border-slate-200"
          >
            <p>Abhishek Gupta • QA Automation Engineer</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
