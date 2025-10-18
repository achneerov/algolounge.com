
import React from 'react';
import { ZapIcon, TargetIcon, TrendingUpIcon, CodeIcon, LightbulbIcon, RocketIcon } from './IconComponents';

const featureItems = [
  {
    icon: ZapIcon,
    title: "Real-time Execution",
    description: "Test your solutions instantly with our integrated code editor and execution environment.",
  },
  {
    icon: TargetIcon,
    title: "Interview-focused",
    description: "Practice problems commonly asked at top tech companies like Google, Amazon, and Microsoft.",
  },
  {
    icon: TrendingUpIcon,
    title: "Track Progress",
    description: "Monitor your improvement with detailed analytics and completion tracking.",
  },
  {
    icon: CodeIcon,
    title: "Multiple Languages",
    description: "Code in Python, JavaScript, TypeScript, and Java with full syntax highlighting.",
  },
  {
    icon: LightbulbIcon,
    title: "Detailed Solutions",
    description: "Learn from comprehensive explanations and optimized solutions for every problem.",
  },
  {
    icon: RocketIcon,
    title: "Structured Learning",
    description: "Follow curated courses that build your skills from basics to advanced concepts.",
  },
];

export const Features: React.FC = () => {
  return (
    <section className="bg-[#181818] py-20 sm:py-24">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-100">Why Choose AlgoLounge?</h2>
          <p className="mt-4 text-lg text-gray-400">Everything you need to ace your coding interviews, wrapped in a beautiful interface.</p>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureItems.map((item, index) => (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-lg blur opacity-0 group-hover:opacity-60 transition duration-300"></div>
              <div className="relative bg-gray-900/80 p-6 rounded-lg border border-gray-800 h-full">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-500/10 p-2 rounded-md">
                    <item.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100">{item.title}</h3>
                </div>
                <p className="mt-4 text-gray-400 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};