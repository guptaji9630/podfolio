import { jsPDF } from 'jspdf';
import { resume } from '../data/resume';

// Native text preserves reading order and lets recruiters select/search the PDF.
export function createResumePDF() {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const margin = 40;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const bottom = pdf.internal.pageSize.getHeight() - margin;
  let y = margin;

  pdf.setProperties({ title: `${resume.name} - QA Automation Engineer`, author: 'Abhishek Gupta' });

  function ensureSpace(height: number) {
    if (y + height > bottom) {
      pdf.addPage();
      y = margin;
    }
  }

  function text(value: string, size = 10, bold = false, indent = 0) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    const lines: string[] = pdf.splitTextToSize(value, width - indent);
    const lineHeight = size * 1.22;
    ensureSpace(lines.length * lineHeight);
    for (const line of lines) {
      pdf.text(line, margin + indent, y + size);
      y += lineHeight;
    }
  }

  function section(title: string) {
    // Keep the heading with at least the first few lines of its content.
    ensureSpace(65);
    y += 7;
    text(title.toUpperCase(), 10.5, true);
    y += 3;
  }

  function bullet(value: string) {
    text(`- ${value}`, 10, false, 5);
  }

  text(resume.name, 19, true);
  text(resume.headline, 11, true);
  text(`${resume.location} | ${resume.email} | ${resume.phone}`, 9);
  section('Professional Summary');
  text(resume.summary);
  section('Technical Skills');
  for (const skill of resume.skills) text(`${skill.label}: ${skill.skills}`);
  section('Professional Experience');
  for (const job of resume.experience) {
    ensureSpace(65);
    text(`${job.title} | ${job.company}`, 10, true);
    text(job.period, 9);
    for (const item of job.items) bullet(item);
    y += 3;
  }
  section('Selected Projects');
  for (const project of resume.projects) {
    ensureSpace(55);
    text(project.title, 10, true);
    for (const item of project.items) bullet(item);
    y += 3;
  }
  section('Education');
  text(resume.education.degree, 10, true);
  text(`${resume.education.institution}, ${resume.education.location}`);
  text(`${resume.education.period} | ${resume.education.grade}`, 9);
  section('Additional Information');
  for (const item of resume.additional) text(`${item.label}: ${item.value}`, 9);

  return pdf;
}
