
import React, { useState } from 'react';
import { MOCK_COURSES } from '../constants';
import type { Course } from '../types';
import { StarIcon } from './IconComponents';

interface CoursesViewProps {
  onSelectCourse: (course: Course) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ onSelectCourse }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = MOCK_COURSES.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-100">Courses</h1>
        <p className="mt-4 text-lg text-gray-400">
          Discover programming courses and tutorials designed to level up your coding skills.
        </p>
      </div>

      <div className="max-w-xl mx-auto mt-10">
        <input
          type="text"
          placeholder="Search Courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="max-w-xl mx-auto mt-8 space-y-4">
        {filteredCourses.map(course => (
          <div
            key={course.id}
            onClick={() => onSelectCourse(course)}
            className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700/50 hover:border-emerald-500/50 transition-all"
          >
            <div>
              <h2 className="font-semibold text-gray-100">{course.title}</h2>
              <p className="text-sm text-gray-400">{course.description}</p>
            </div>
            <button className="p-2 rounded-full hover:bg-gray-600">
              <StarIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
