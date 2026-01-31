import { useState, useEffect, useCallback, useMemo } from 'react';
import { CourseSearchResult } from '../types';

interface CoursesIndex {
  courses: {
    filename: string;
    title: string;
    description: string;
    keywords: string[];
  }[];
  lastUpdated: string;
  totalCourses: number;
}

let cachedIndex: CoursesIndex | null = null;
let indexPromise: Promise<CoursesIndex> | null = null;

async function loadCoursesIndex(): Promise<CoursesIndex> {
  if (cachedIndex) return cachedIndex;
  if (indexPromise) return indexPromise;

  indexPromise = fetch('/courses/index.json')
    .then(res => res.json())
    .then(data => {
      cachedIndex = data;
      return data;
    });

  return indexPromise;
}

function calculateScore(course: CoursesIndex['courses'][0], query: string): number {
  let score = 0;

  if (course.filename.toLowerCase() === query) {
    score += 100;
  }

  if (course.filename.toLowerCase().includes(query)) {
    score += 50;
  }

  if (course.title.toLowerCase() === query) {
    score += 80;
  }

  if (course.title.toLowerCase().includes(query)) {
    score += 30;
  }

  for (const keyword of course.keywords || []) {
    if (keyword.toLowerCase() === query) {
      score += 20;
    } else if (keyword.toLowerCase().includes(query)) {
      score += 10;
    }
  }

  return score;
}

export function useCourseSearch() {
  const [index, setIndex] = useState<CoursesIndex | null>(cachedIndex);
  const [isLoaded, setIsLoaded] = useState(!!cachedIndex);

  useEffect(() => {
    loadCoursesIndex().then(data => {
      setIndex(data);
      setIsLoaded(true);
    }).catch(err => {
      console.error('Failed to load courses index:', err);
    });
  }, []);

  const allCourses = useMemo((): CourseSearchResult[] => {
    if (!index) return [];
    return index.courses.map(c => ({
      ...c,
      score: 0
    }));
  }, [index]);

  const searchCourses = useCallback((query: string): CourseSearchResult[] => {
    if (!index || !query.trim()) {
      return allCourses;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: CourseSearchResult[] = [];

    for (const course of index.courses) {
      const score = calculateScore(course, normalizedQuery);
      if (score > 0) {
        results.push({
          ...course,
          score
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }, [index, allCourses]);

  return {
    isLoaded,
    allCourses,
    searchCourses
  };
}
