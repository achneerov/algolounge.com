
import React from 'react';

interface CtaSectionProps {
  onNavigate: (page: 'courses') => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onNavigate }) => {
  return (
    <section className="bg-gradient-to-t from-[#111111] to-[#181818] py-20 sm:py-24">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-100">Ready to Level Up Your Coding Skills?</h2>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
          Join thousands of developers who've improved their problem-solving abilities and landed their dream jobs.
        </p>
        <div className="mt-8">
          <button
            onClick={() => onNavigate('courses')}
            className="bg-emerald-500 text-white font-semibold px-8 py-3 rounded-md hover:bg-emerald-600 transition-all transform hover:scale-105"
          >
            Discover Courses
          </button>
        </div>
      </div>
    </section>
  );
};
