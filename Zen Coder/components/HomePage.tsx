
import React from 'react';
import { Features } from './Features';
import { CtaSection } from './CtaSection';
import { CodeSnippet } from './CodeSnippet';
import { PlayIcon, BookOpenIcon, GoogleLogo, AmazonLogo, MicrosoftLogo, MetaLogo } from './IconComponents';

interface HomePageProps {
  onNavigate: (page: 'home' | 'questions' | 'courses') => void;
}

const TrustedBy: React.FC = () => (
  <div className="py-12 bg-[#141414]">
    <div className="container mx-auto px-6 text-center">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        Trusted by developers at
      </h3>
      <div className="mt-6 flex justify-center items-center gap-x-8 md:gap-x-12 grayscale opacity-60">
        <GoogleLogo className="h-7" />
        <AmazonLogo className="h-7" />
        <MicrosoftLogo className="h-6" />
        <MetaLogo className="h-6" />
      </div>
    </div>
  </div>
);


const Hero: React.FC<HomePageProps> = ({ onNavigate }) => (
  <section className="relative overflow-hidden bg-[#111111]">
    <div className="absolute inset-0 bg-grid-gray-800/20 [mask-image:linear-gradient(to_bottom,white_5%,transparent_100%)]"></div>
    <div className="absolute top-[-30%] left-[20%] w-[60%] h-[80%] bg-emerald-900/50 rounded-full blur-3xl animate-pulse-slow"></div>
    <div className="absolute bottom-[-30%] right-[20%] w-[50%] h-[70%] bg-sky-900/50 rounded-full blur-3xl animate-pulse-slow animation-delay-3000"></div>

    <div className="container mx-auto px-6 py-24 sm:py-32 lg:py-40 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-gray-100 to-gray-300 tracking-tight animate-fade-in-up">
            Find Your
            <span className="block text-emerald-400 bg-gradient-to-r from-emerald-400 to-sky-400 animate-hero-gradient">Flow State.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Master algorithms with a calm, focused, and beautiful practice environment. Join thousands of developers sharpening their skills for interviews and beyond.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <button onClick={() => onNavigate('questions')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 text-white font-semibold px-6 py-3 rounded-md hover:bg-emerald-600 transition-all transform hover:scale-105">
              <PlayIcon className="w-5 h-5" />
              Random Question
            </button>
            <button onClick={() => onNavigate('courses')} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-800/50 border border-gray-700 text-gray-200 font-semibold px-6 py-3 rounded-md hover:bg-gray-700/80 transition-all">
              <BookOpenIcon className="w-5 h-5" />
              Explore Courses
            </button>
          </div>
          <div className="mt-12 flex justify-center lg:justify-start gap-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-sm text-gray-500">Challenges</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">10k+</p>
              <p className="text-sm text-gray-500">Solutions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">4</p>
              <p className="text-sm text-gray-500">Languages</p>
            </div>
          </div>
        </div>
        <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CodeSnippet className="transform-gpu rotate-3 hover:rotate-0 transition-transform duration-500" />
        </div>
      </div>
    </div>
  </section>
);


export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <TrustedBy />
      <Features />
      <CtaSection onNavigate={onNavigate} />
    </>
  );
};