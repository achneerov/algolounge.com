
import React from 'react';
import { LogoIcon } from './IconComponents';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-bold text-gray-100">AlgoLounge</span>
          </div>
          <p className="text-sm text-gray-500 mt-4 md:mt-0">
            © {new Date().getFullYear()} AlgoLounge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
