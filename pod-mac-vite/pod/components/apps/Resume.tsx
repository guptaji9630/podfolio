
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { transitions } from '../../src/types/motion';

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
  const resumeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadPDF = async () => {
    if (!resumeRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const element = resumeRef.current;
      const originalStyles = {
        width: element.style.width,
        height: element.style.height,
        overflow: element.style.overflow,
        transform: element.style.transform,
        transformOrigin: element.style.transformOrigin,
      };

      element.style.width = '794px';
      element.style.overflow = 'visible';
      element.style.transform = 'none';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-resume-content]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.width = '794px';
            clonedElement.style.fontFamily = 'Arial, sans-serif';
            clonedElement.style.fontSize = '12px';
          }
        }
      });

      Object.assign(element.style, originalStyles);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = pdfWidth / (imgWidth * 0.264583);
      const imgWidthMm = imgWidth * 0.264583 * ratio;
      const imgHeightMm = imgHeight * 0.264583 * ratio;

      let remainingHeight = imgHeightMm;
      let pageY = 0;
      let pageNum = 0;

      while (remainingHeight > 0) {
        if (pageNum > 0) {
          pdf.addPage();
        }
        
        const pageHeight = Math.min(pdfHeight, remainingHeight);
        pdf.addImage(imgData, 'PNG', 0, -pageY * 0.264583 * ratio, imgWidthMm, imgHeightMm, undefined, 'FAST');
        
        remainingHeight -= pdfHeight;
        pageY += pdfHeight / (0.264583 * ratio);
        pageNum++;
      }

      pdf.save('Abhishek_Gupta_Resume.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
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

        <motion.div
          ref={resumeRef}
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
              ABHISHEK GUPTA
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="text-primary text-sm md:text-base font-semibold mt-1"
            >
              Quality Assurance Engineer | Software Tester
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-slate-400 mt-2"
            >
              B.Tech in Computer Science & Engineering, 2025
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
                <span>abhishekg9630@gmail.com</span>
              </div>
              <div className="flex items-center gap-1">
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="material-symbols-outlined text-[14px]"
                >
                  call
                </motion.span>
                <span>+91-9560934582</span>
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
                Dedicated Quality Assurance Engineer with hands-on experience in manual and automated testing. Skilled in identifying bugs, 
                ensuring product quality, and improving testing processes. Strong background in software development with expertise in MERN stack 
                and testing frameworks like Jest and Playwright. Proficient in AI-assisted development using GitHub Copilot, Cursor, and ChatGPT for 
                test automation, code generation, and debugging. Committed to delivering high-quality software through rigorous testing and continuous improvement.
              </motion.p>
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
                    <h3 className="text-[11px] md:text-xs font-bold text-slate-900">B.Tech. Computer Science & Engineering</h3>
                    <p className="text-[10px] text-primary font-semibold">KCC Institute of Technology and Management</p>
                    <p className="text-[9px] md:text-[10px] text-slate-500">Greater Noida • 7.0 CGPA</p>
                  </div>
                  <span className="text-[9px] md:text-[10px] text-slate-500 font-medium whitespace-nowrap">May 2021 - Mar 2025</span>
                </div>
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
                Experience
              </motion.h2>
              <motion.div
                className="space-y-4"
                variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
              >
                {[
                  {
                    title: 'Associate Engineer (QA)',
                    company: 'Successive Digital',
                    period: 'May 2025 - Present',
                    items: [
                      'Ran manual checks on new features to ensure everything worked as expected',
                      'Reported clear and detailed issues to help speed up fixes',
                      'Helped improve the testing process by sharing feedback with the team'
                    ]
                  },
                  {
                    title: 'Software Engineer Trainee',
                    company: 'Successive Digital',
                    period: 'May 2025 - Nov 2025',
                    items: [
                      'Developed the fitness-forge MERN app',
                      'Develop skills in Next.js, Node.js with Jest Testing',
                      'Technologies used: JavaScript, NEXT.js, Axios, MongoDB, Git, Github, Node.js, Graph QL'
                    ]
                  },
                  {
                    title: 'Freelance Web Developer',
                    company: 'Freelance',
                    period: 'May 2023 - Mar 2024',
                    items: [
                      'Delivered tailored web development solutions for various clients using React.js and Node.js',
                      'Improved user experience and boosted website traffic by 15% on average',
                      'Managed end-to-end project lifecycles, ensuring timely and high-quality deliverables'
                    ]
                  }
                ].map((exp, i) => (
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
                Projects
              </motion.h2>
              <motion.div className="space-y-3" variants={{ animate: { transition: { staggerChildren: 0.05 } } }}>
                {[
                  {
                    title: 'Trail Management System - Agmatix',
                    items: [
                      'Tested core features of the trial platform to ensure smooth data flow and reliable performance',
                      'Reported bugs with clear steps and worked with the team to improve system quality',
                      'Checked each update of the tool to make sure it stayed stable and easy to use'
                    ]
                  },
                  {
                    title: 'FitForge - The Fitness Tracker',
                    items: [
                      'Developed a full stack web app using MERN stack for fitness lovers',
                      'The application shows the analytical data of the workout with progress photo feature',
                      'Libraries: MERN, Graph QL'
                    ]
                  }
                ].map((proj, i) => (
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

            {/* Skills */}
            <motion.section
              variants={sectionVariants}
            >
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900"
              >
                Skills
              </motion.h2>
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
                variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
              >
                {[
                  { label: 'QA & Testing', skills: 'Manual Testing, Automated Testing, Bug Reporting, Test Cases, Jest, Playwright, Selenium, Cypress, API Testing, Regression Testing, Smoke Testing' },
                  { label: 'Development', skills: 'JavaScript, React Native, Node.js, HTML, CSS, MERN Stack, Next.js' },
                  { label: 'Tools & Others', skills: 'Git, GitHub, MongoDB, MySQL, Postman, Android Development, C++, Python, Docker, CI/CD Pipelines' },
                  { label: 'AI Development Tools', skills: 'GitHub Copilot, Cursor IDE, ChatGPT, Claude Code, AI-assisted testing, Prompt engineering for test generation' }
                ].map((skill, i) => (
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
                {[
                  { label: 'Languages:', value: 'Hindi, English' },
                  { label: 'Certifications:', value: 'Machine Learning Course by Andrew Nug On Cousera, Java Foundational Certification on Udemy, Digital Marketing Certification on Google, Graph QL Associate Certification' },
                  { label: 'Awards/Activities:', value: 'Snap AR hackathon(2022): Among the top 10% successful candidates. Nasa Space App hackathon: Among the top 20% successful candidates.' }
                ].map((info, i) => (
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
            <p>Abhishek Gupta • Quality Assurance Engineer • 2026</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
