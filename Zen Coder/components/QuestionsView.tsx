import React, { useState, useCallback } from 'react';
import type { Question } from '../types';
import { CodeSnippet } from './CodeSnippet';
import { RefreshCwIcon, PlayIcon, LightbulbIcon, XIcon, SendHorizonalIcon, CheckCircleIcon, FlameIcon, CopyIcon, ChevronDownIcon } from './IconComponents';

interface QuestionsViewProps {
  question: Question;
}

const DifficultyPill: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
  const colorMap = {
    Easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${colorMap[difficulty]}`}>
      {difficulty}
    </span>
  );
};

const DescriptionRenderer: React.FC<{ text: string }> = ({ text }) => {
  const processLine = (line: string) => {
    line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/`([^`]+)`/g, '<code class="bg-gray-700/50 rounded px-1.5 py-0.5 font-mono text-sm text-emerald-300">$1</code>');
    return line;
  };
  
  return (
    <>
      {text.split('\n').map((line, index) => (
        <p key={index} dangerouslySetInnerHTML={{ __html: processLine(line) }} className={line.trim() === '' ? 'h-4' : ''} />
      ))}
    </>
  );
};

const SolutionDisplay: React.FC<{ question: Question }> = ({ question }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);

    const handleCopy = () => {
        if (question.solutionCode) {
            navigator.clipboard.writeText(question.solutionCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    if (!question.solutionCode) {
        return <p className="text-gray-400">Solution not available yet.</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-2">Solution Code</h3>
                <div className="relative group">
                    <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-1.5 bg-gray-700/50 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
                    >
                        {isCopied ? <CheckCircleIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                    <CodeSnippet code={question.solutionCode} language="python" />
                </div>
            </div>

            {question.solutionExplanation && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">Explanation</h3>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 bg-gray-800/50 border border-gray-700 rounded-md p-4">
                        <DescriptionRenderer text={question.solutionExplanation} />
                    </div>
                </div>
            )}

            {question.solutionInDepth && (
                 <div>
                    <button onClick={() => setIsDeepDiveOpen(!isDeepDiveOpen)} className="w-full flex justify-between items-center p-3 bg-gray-800/50 border border-gray-700 rounded-md hover:bg-gray-700/50">
                        <span className="font-semibold text-emerald-400">Deep Dive Explanation</span>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isDeepDiveOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDeepDiveOpen && (
                        <div className="prose prose-invert prose-sm max-w-none text-gray-300 bg-gray-900/50 border border-t-0 border-gray-700 rounded-b-md p-4 animate-fade-in">
                            <DescriptionRenderer text={question.solutionInDepth} />
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
};


const SuccessAnimation: React.FC = () => {
    const confetti = Array.from({ length: 15 }).map((_, i) => {
    const style = {
      left: `${Math.random() * 100}%`,
      animation: `confetti-${['slow', 'medium', 'fast'][i % 3]} ${2 + Math.random() * 4}s linear infinite`,
      backgroundColor: ['#2dd4bf', '#38bdf8', '#a78bfa'][i % 3],
    };
    return <div key={i} className="absolute top-0 w-2 h-4 rounded-full" style={style}></div>;
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-hidden">
      {confetti}
      <div className="bg-gray-800 border border-emerald-500/50 rounded-lg p-8 text-center animate-fade-in-scale shadow-2xl shadow-emerald-900/50">
        <CheckCircleIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white">Success!</h2>
        <p className="text-gray-300 mt-2">Problem solved. Keep up the great work!</p>
        <div className="mt-6 flex justify-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-sky-400">+100</p>
            <p className="text-sm text-gray-400">XP Gained</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <FlameIcon className="w-6 h-6 text-orange-400" />
              <p className="text-2xl font-bold text-orange-400">+1</p>
            </div>
            <p className="text-sm text-gray-400">Streak Extended</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuestionsView: React.FC<QuestionsViewProps> = ({ question }) => {
  const [activeTab, setActiveTab] = useState<'description' | 'solution'>('description');
  const [userCode, setUserCode] = useState(question.starterCode);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] bg-[#181818]">
      {showSuccess && <SuccessAnimation />}
      {/* Left Panel: Description */}
      <div className="w-full lg:w-1/2 p-4 lg:p-6 overflow-y-auto border-r border-gray-800">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-100">{question.title}</h1>
            <DifficultyPill difficulty={question.difficulty} />
        </div>
        <div className="flex border-b border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'description' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('solution')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'solution' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}
          >
            Solution
          </button>
        </div>

        {activeTab === 'description' ? (
          <div className="prose prose-invert prose-sm max-w-none text-gray-300">
            <DescriptionRenderer text={question.description} />
            <h3 className="text-gray-100 mt-6 font-semibold">Examples:</h3>
            {question.examples.map((ex, i) => (
              <div key={i} className="bg-gray-800/50 rounded-md p-3 my-2 border border-gray-700">
                <p><strong>Input:</strong> <code className="text-sm font-mono">{ex.input}</code></p>
                <p><strong>Output:</strong> <code className="text-sm font-mono">{ex.output}</code></p>
                {ex.explanation && <p className="mt-2"><small><strong>Explanation:</strong> {ex.explanation}</small></p>}
              </div>
            ))}
          </div>
        ) : (
          <SolutionDisplay question={question} />
        )}
      </div>

      {/* Right Panel: Editor */}
      <div className="w-full lg:w-1/2 p-4 lg:p-6 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400 font-mono">python</span>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-md bg-gray-800/80 hover:bg-gray-700/80 transition-colors" title="Reset Code" onClick={() => setUserCode(question.starterCode)}>
                <RefreshCwIcon className="w-4 h-4 text-gray-300" />
            </button>
            <button onClick={() => setShowHint(true)} disabled={!question.hint || showHint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <LightbulbIcon className="w-4 h-4" />
              Hint
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm transition-colors">
              <PlayIcon className="w-4 h-4" />
              Run
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <SendHorizonalIcon className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
        <div className="flex-grow bg-[#1e1e1e] rounded-lg border border-gray-700 relative">
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className="w-full h-full bg-transparent text-gray-200 font-mono text-sm p-4 resize-none outline-none leading-relaxed"
            spellCheck="false"
          />
        </div>
        <div className="mt-4 bg-gray-800/50 rounded-lg p-4 h-32 overflow-y-auto border border-gray-700">
           {showHint && question.hint ? (
            <div className="p-3 bg-blue-900/50 border border-blue-700 rounded-md text-blue-200 text-sm animate-fade-in">
              <div className="flex justify-between items-start">
                  <div><strong>Hint:</strong> {question.hint}</div>
                  <button onClick={() => setShowHint(false)} className="p-1 -mt-1 -mr-1"><XIcon className="w-4 h-4" /></button>
              </div>
            </div>
           ) : (
            <p className="text-sm text-gray-500">Click "Run" to execute your code and see test results here.</p>
           )}
        </div>
      </div>
    </div>
  );
};