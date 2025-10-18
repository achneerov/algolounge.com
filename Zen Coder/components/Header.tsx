import React from 'react';
import { LogoIcon, GithubIcon } from './IconComponents';

type Page = 'home' | 'questions' | 'courses' | 'courseDetail' | 'progress';

interface HeaderProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const navItems = [
    { name: 'Home', page: 'home' as Page },
    { name: 'Questions', page: 'questions' as Page },
    { name: 'Courses', page: 'courses' as Page },
    { name: 'Progress', page: 'progress' as Page },
  ];

  const activeClasses = "text-emerald-400";
  const inactiveClasses = "text-gray-400 hover:text-emerald-400 transition-colors";

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#111111]/80 backdrop-blur-sm z-50 border-b border-gray-800">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
          <LogoIcon className="w-8 h-8 text-emerald-400" />
          <span className="text-xl font-bold text-gray-100">AlgoLounge</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map(item => (
            <button
              key={item.name}
              onClick={() => onNavigate(item.page)}
              className={`text-sm font-medium ${
                currentPage === item.page || (currentPage === 'courseDetail' && item.page === 'courses') ? activeClasses : inactiveClasses
              }`}
            >
              {item.name}
            </button>
          ))}
        </nav>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-400 transition-colors">
          <GithubIcon className="w-6 h-6" />
        </a>
      </div>
    </header>
  );
};