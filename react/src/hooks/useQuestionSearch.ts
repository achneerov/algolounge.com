import { useState, useEffect, useCallback, useMemo } from 'react';
import { QuestionSearchResult } from '../types';

interface QuestionsIndex {
  questions: {
    filename: string;
    title: string;
    difficulty: string;
    tags: string[];
    keywords: string[];
  }[];
  lastUpdated: string;
  totalQuestions: number;
}

let cachedIndex: QuestionsIndex | null = null;
let indexPromise: Promise<QuestionsIndex> | null = null;

async function loadQuestionsIndex(): Promise<QuestionsIndex> {
  if (cachedIndex) return cachedIndex;
  if (indexPromise) return indexPromise;

  indexPromise = fetch('/questions/index.json')
    .then(res => res.json())
    .then(data => {
      cachedIndex = data;
      return data;
    });

  return indexPromise;
}

function calculateScore(question: QuestionsIndex['questions'][0], query: string): number {
  let score = 0;

  if (question.filename.toLowerCase() === query) {
    score += 100;
  }

  if (question.filename.toLowerCase().includes(query)) {
    score += 50;
  }

  if (question.title.toLowerCase() === query) {
    score += 80;
  }

  if (question.title.toLowerCase().includes(query)) {
    score += 30;
  }

  for (const keyword of question.keywords) {
    if (keyword.toLowerCase() === query) {
      score += 20;
    } else if (keyword.toLowerCase().includes(query)) {
      score += 10;
    }
  }

  const filenameParts = question.filename.split('-');
  for (const part of filenameParts) {
    if (part.toLowerCase().startsWith(query)) {
      score += 15;
    }
  }

  return score;
}

export function useQuestionSearch() {
  const [index, setIndex] = useState<QuestionsIndex | null>(cachedIndex);
  const [isLoaded, setIsLoaded] = useState(!!cachedIndex);

  useEffect(() => {
    loadQuestionsIndex().then(data => {
      setIndex(data);
      setIsLoaded(true);
    }).catch(err => {
      console.error('Failed to load questions index:', err);
    });
  }, []);

  const allQuestions = useMemo((): QuestionSearchResult[] => {
    if (!index) return [];
    return index.questions.map(q => ({
      ...q,
      score: 0
    }));
  }, [index]);

  const searchQuestions = useCallback((query: string): QuestionSearchResult[] => {
    if (!index || !query.trim()) {
      return allQuestions;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: QuestionSearchResult[] = [];

    for (const question of index.questions) {
      const score = calculateScore(question, normalizedQuery);
      if (score > 0) {
        results.push({
          ...question,
          score
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }, [index, allQuestions]);

  const getUniqueTags = useCallback((): string[] => {
    if (!index) return [];
    const tagSet = new Set<string>();
    index.questions.forEach(q => {
      q.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [index]);

  return {
    isLoaded,
    allQuestions,
    searchQuestions,
    getUniqueTags
  };
}
