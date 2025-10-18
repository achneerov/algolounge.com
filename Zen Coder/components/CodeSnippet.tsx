
import React from 'react';

const defaultCode = `
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
`;

interface CodeSnippetProps {
  code?: string;
  language?: string;
  className?: string;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ code = defaultCode, language = 'python', className = '' }) => {
  const lines = code.trim().split('\n');

  return (
    <div className={`bg-[#1e1e1e] rounded-lg border border-gray-700 shadow-2xl shadow-emerald-500/10 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        </div>
        <div className="text-xs text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded">
          {language === 'python' ? 'solution.py' : 'solution.js'}
        </div>
      </div>
      <div className="p-4 text-sm font-mono overflow-x-auto">
        {lines.map((line, index) => (
          <div key={index} className="flex items-start">
            <span className="mr-4 text-gray-600 text-right w-6 select-none">{index + 1}</span>
            <pre className="text-gray-300 whitespace-pre" dangerouslySetInnerHTML={{__html: line.replace(/(\bdef\b|\bfor\b|\bin\b|\bif\b|\breturn\b|else|not)/g, '<span class="text-sky-400">\$1</span>').replace(/(enumerate|if stack else|stack.pop|stack.append)/g, '<span class="text-emerald-400">\$1</span>')}}/>
          </div>
        ))}
      </div>
    </div>
  );
};