
import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const Resume: React.FC = () => {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadPDF = async () => {
    if (!resumeRef.current || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        windowHeight: resumeRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-resume-content]') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.fontFamily = 'Arial, sans-serif';
            clonedElement.style.fontSize = '14px';
          }
        }
      });
      
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
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583));
      const imgX = (pdfWidth - imgWidth * 0.264583 * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 0, imgWidth * 0.264583 * ratio, imgHeight * 0.264583 * ratio, undefined, 'FAST');
      pdf.save('Abhishek_Gupta_Resume.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#333]">
      {/* Pages Sidebar */}
      <div className="hidden md:flex w-36 lg:w-44 bg-[#2A2A2A] border-r border-black/30 flex-col overflow-y-auto shrink-0 py-4 px-3 gap-6 select-none">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <span className="material-symbols-outlined text-[16px]">
            {isDownloading ? 'hourglass_empty' : 'download'}
          </span>
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
        
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
      </div>

      {/* Main View */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 flex flex-col items-center bg-[#323232]">
        {/* Mobile Download Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="md:hidden mb-4 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg w-full max-w-[600px]"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isDownloading ? 'hourglass_empty' : 'download'}
          </span>
          {isDownloading ? 'Generating PDF...' : 'Download PDF'}
        </button>

        <div ref={resumeRef} data-resume-content className="bg-white w-full max-w-[600px] md:w-[600px] shadow-2xl shrink-0 flex flex-col font-sans">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 md:p-8 border-b-4 border-primary">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">ABHISHEK GUPTA</h1>
            <p className="text-primary text-sm md:text-base font-semibold mt-1">Quality Assurance Engineer | Software Tester</p>
            <p className="text-xs text-slate-400 mt-2">B.Tech in Computer Science & Engineering, 2025</p>
            <div className="flex flex-wrap gap-4 mt-4 text-[10px] md:text-xs text-slate-300">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">mail</span>
                <span>abhishekg9630@gmail.com</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">call</span>
                <span>+91-9560934582</span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex-1 flex flex-col gap-5 md:gap-6 text-slate-800">
            {/* Professional Summary */}
            <section>
              <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-primary pb-1 mb-3 text-slate-900">Professional Summary</h2>
              <p className="text-[10px] md:text-[11px] leading-relaxed text-slate-700">
                Dedicated Quality Assurance Engineer with hands-on experience in manual and automated testing. Skilled in identifying bugs, 
                ensuring product quality, and improving testing processes. Strong background in software development with expertise in MERN stack 
                and testing frameworks like Jest and Playwright. Committed to delivering high-quality software through rigorous testing and continuous improvement.
              </p>
            </section>

            {/* Education */}
            <section>
              <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900">Education</h2>
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[11px] md:text-xs font-bold text-slate-900">B.Tech. Computer Science & Engineering</h3>
                    <p className="text-[10px] text-primary font-semibold">KCC Institute of Technology and Management</p>
                    <p className="text-[9px] md:text-[10px] text-slate-500">Greater Noida • 7.0 CGPA</p>
                  </div>
                  <span className="text-[9px] md:text-[10px] text-slate-500 font-medium whitespace-nowrap">May 2021 - Mar 2025</span>
                </div>
              </div>
            </section>

            {/* Experience */}
            <section>
              <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900">Experience</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-[11px] md:text-xs font-bold text-slate-900">Associate Engineer (QA)</h3>
                    <span className="text-[9px] md:text-[10px] text-slate-500 font-medium whitespace-nowrap">May 2025 - Nov 2025</span>
                  </div>
                  <p className="text-[10px] text-primary font-bold mb-2">Successive Digital</p>
                  <ul className="text-[9px] md:text-[10px] text-slate-600 space-y-1 ml-4 list-disc">
                    <li>Ran manual checks on new features to ensure everything worked as expected</li>
                    <li>Reported clear and detailed issues to help speed up fixes</li>
                    <li>Helped improve the testing process by sharing feedback with the team</li>
                  </ul>
                </div>

                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-[11px] md:text-xs font-bold text-slate-900">Software Engineer Trainee</h3>
                    <span className="text-[9px] md:text-[10px] text-slate-500 font-medium whitespace-nowrap">May 2025 - Nov 2025</span>
                  </div>
                  <p className="text-[10px] text-primary font-bold mb-2">Successive Digital</p>
                  <ul className="text-[9px] md:text-[10px] text-slate-600 space-y-1 ml-4 list-disc">
                    <li>Developed the fitness-forge MERN app</li>
                    <li>Develop skills in Next.js, Node.js with Jest Testing</li>
                    <li>Technologies used: JavaScript, NEXT.js, Axios, MongoDB, Git, Github, Node.js, Graph QL</li>
                  </ul>
                </div>

                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-[11px] md:text-xs font-bold text-slate-900">Freelance Web Developer</h3>
                    <span className="text-[9px] md:text-[10px] text-slate-500 font-medium whitespace-nowrap">May 2023 - Mar 2024</span>
                  </div>
                  <ul className="text-[9px] md:text-[10px] text-slate-600 space-y-1 ml-4 list-disc">
                    <li>Delivered tailored web development solutions for various clients using React.js and Node.js</li>
                    <li>Improved user experience and boosted website traffic by 15% on average</li>
                    <li>Managed end-to-end project lifecycles, ensuring timely and high-quality deliverables</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Projects */}
            <section>
              <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900">Projects</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-[11px] md:text-xs font-bold text-slate-900">Trail Management System - Agmatix</h3>
                  <ul className="text-[9px] md:text-[10px] text-slate-600 space-y-1 ml-4 list-disc mt-1">
                    <li>Tested core features of the trial platform to ensure smooth data flow and reliable performance</li>
                    <li>Reported bugs with clear steps and worked with the team to improve system quality</li>
                    <li>Checked each update of the tool to make sure it stayed stable and easy to use</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-[11px] md:text-xs font-bold text-slate-900">FitForge - The Fitness Tracker</h3>
                  <ul className="text-[9px] md:text-[10px] text-slate-600 space-y-1 ml-4 list-disc mt-1">
                    <li>Developed a full stack web app using MERN stack for fitness lovers</li>
                    <li>The application shows the analytical data of the workout with progress photo feature</li>
                    <li>Libraries: MERN, Graph QL</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900">Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold text-primary uppercase mb-1.5">QA & Testing</h4>
                  <p className="text-[9px] md:text-[10px] text-slate-700 leading-relaxed">Manual Testing, Automated Testing, Bug Reporting, Test Cases, Jest, Playwright, Selenium, Cypress, API Testing, Regression Testing, Smoke Testing</p>
                </div>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold text-primary uppercase mb-1.5">Development</h4>
                  <p className="text-[9px] md:text-[10px] text-slate-700 leading-relaxed">JavaScript, React Native, Node.js, HTML, CSS, MERN Stack, Next.js</p>
                </div>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold text-primary uppercase mb-1.5">Tools & Others</h4>
                  <p className="text-[9px] md:text-[10px] text-slate-700 leading-relaxed">Git, GitHub, MongoDB, MySQL, Postman, Android Development, C++, Python</p>
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h2 className="text-[11px] md:text-xs font-bold uppercase tracking-widest border-b-2 border-slate-300 pb-1 mb-3 text-slate-900">Additional Information</h2>
              <div className="space-y-2">
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold text-slate-900">Languages:</h4>
                  <p className="text-[9px] md:text-[10px] text-slate-700">Hindi, English</p>
                </div>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold text-slate-900">Certifications:</h4>
                  <p className="text-[9px] md:text-[10px] text-slate-700">Machine Learning Course by Andrew Nug On Cousera, Java Foundational Certification on Udemy, Digital Marketing Certification on Google, Graph QL Associate Certification</p>
                </div>
                <div>
                  <h4 className="text-[9px] md:text-[10px] font-bold text-slate-900">Awards/Activities:</h4>
                  <p className="text-[9px] md:text-[10px] text-slate-700">Snap AR hackathon(2022): Among the top 10% successful candidates. Nasa Space App hackathon: Among the top 20% successful candidates.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="p-4 text-center text-[9px] text-slate-400 border-t border-slate-200">
            <p>Abhishek Gupta • Quality Assurance Engineer • 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};
