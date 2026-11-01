import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(appRoot, '../../resumes/paypay-qa-automation');
const compiled = await build({
  stdin: {
    contents: "export { resume } from './src/data/resume'; export { createResumePDF } from './src/utils/resumePdf';",
    resolveDir: appRoot,
    loader: 'ts',
  },
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'cjs',
  write: false,
});
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(
  createRequire(import.meta.url), module, module.exports
);
const { resume, createResumePDF } = module.exports;
const contact = `${resume.location} | ${resume.email} | ${resume.phone}`;
const sections = [
  ['PROFESSIONAL SUMMARY', [resume.summary]],
  ['TECHNICAL SKILLS', resume.skills.map(s => `${s.label}: ${s.skills}`)],
  ['PROFESSIONAL EXPERIENCE', resume.experience.flatMap(job => [
    `${job.title} | ${job.company}`, job.period, ...job.items.map(x => `- ${x}`), '',
  ])],
  ['SELECTED PROJECTS', resume.projects.flatMap(p => [p.title, ...p.items.map(x => `- ${x}`), ''])],
  ['EDUCATION', [resume.education.degree,
    `${resume.education.institution}, ${resume.education.location}`,
    `${resume.education.period} | ${resume.education.grade}`]],
  ['ADDITIONAL INFORMATION', resume.additional.map(x => `${x.label}: ${x.value}`)],
];
const plain = [resume.name, resume.headline, contact, '',
  ...sections.flatMap(([title, lines]) => [title, ...lines, ''])].join('\n');
const markdown = [`# ${resume.name}`, '', resume.headline, '', contact, '',
  ...sections.flatMap(([title, lines]) => [`## ${title}`, '', ...lines, ''])].join('\n');

await mkdir(output, { recursive: true });
const stem = resume.filename.replace(/\.pdf$/, '');
const pdf = createResumePDF();
await writeFile(resolve(output, resume.filename), Buffer.from(pdf.output('arraybuffer')));
await writeFile(resolve(output, `${stem}.txt`), plain);
await writeFile(resolve(output, `${stem}.md`), markdown);
console.log(`Exported ${pdf.getNumberOfPages()}-page PDF, TXT and Markdown to ${output}`);
