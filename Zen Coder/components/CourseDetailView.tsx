
import React from 'react';
import type { Course, Question } from '../types';
import { LinkIcon, MessageSquareIcon, Trash2Icon } from './IconComponents';

interface CourseDetailViewProps {
  course: Course;
  onSelectQuestion: (question: Question) => void;
}

const DifficultyPill: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
    const colorMap = {
      Easy: 'bg-green-500/20 text-green-400 border-green-500/30',
      Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Hard: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${colorMap[difficulty]}`}>
        {difficulty.toUpperCase()}
      </span>
    );
};

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course, onSelectQuestion }) => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-100">{course.title}</h1>
        <p className="mt-4 text-lg text-gray-400">{course.description}</p>

        <div className="mt-10 space-y-8">
          {course.sections.map(section => (
            <div key={section.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-emerald-400">{section.title}</h2>
              <p className="mt-2 text-gray-400">{section.description}</p>

              <div className="mt-6 space-y-3">
                {section.questions.length > 0 ? (
                  section.questions.map(question => (
                    <div
                      key={question.id}
                      onClick={() => onSelectQuestion(question)}
                      className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-md cursor-pointer hover:bg-gray-800/80 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <DifficultyPill difficulty={question.difficulty} />
                        <span className="font-medium text-gray-200">{question.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-emerald-400 rounded-md hover:bg-gray-700"><LinkIcon className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-emerald-400 rounded-md hover:bg-gray-700"><MessageSquareIcon className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700"><Trash2Icon className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No questions in this section yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
