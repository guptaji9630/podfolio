
'use client';

import React, { useState, useRef, useEffect } from 'react';

export const Terminal: React.FC = () => {
  const [history, setHistory] = useState<string[]>(['Welcome to GuptaOS Terminal', 'Type "help" for commands.']);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCmd = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.toLowerCase().trim();
    const newHistory = [...history, `➜ ~ ${input}`];

    if (cmd === 'help') newHistory.push('ls, whoami, clear, contact');
    else if (cmd === 'ls') newHistory.push('projects/  skills/  resume.pdf');
    else if (cmd === 'whoami') newHistory.push('Abhishek Gupta: Software Engineer & Tester');
    else if (cmd === 'clear') { setHistory([]); setInput(''); return; }
    else if (cmd === 'contact') newHistory.push('Contact me at abhishekg9630@gmail.com');
    else if (cmd) newHistory.push(`Command not found: ${cmd}`);

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div 
      className="flex-1 bg-black/95 p-4 font-mono text-sm overflow-y-auto cursor-text" 
      onClick={() => inputRef.current?.focus()}
    >
      <div className="mb-2">
        {history.map((l, i) => <div key={i} className="text-gray-300 mb-0.5 whitespace-pre-wrap">{l}</div>)}
      </div>
      <form onSubmit={handleCmd} className="flex gap-2">
        <span className="text-green-500 font-bold shrink-0">➜</span>
        <span className="text-blue-400 font-bold shrink-0">~</span>
        <input 
          ref={inputRef}
          autoFocus 
          className="bg-transparent border-none outline-none flex-1 text-white caret-primary" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          spellCheck="false" 
          autoComplete="off"
        />
      </form>
      <div ref={endRef} />
    </div>
  );
};
