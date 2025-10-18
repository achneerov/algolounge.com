export interface Question {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: string;
  solutionCode?: string;
  solutionExplanation?: string;
  solutionInDepth?: string;
  hint?: string;
  tags: string[];
}

export interface CourseSection {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  sections: CourseSection[];
}

export interface ActivityLog {
  date: string; // "YYYY-MM-DD"
  count: number; // Number of problems solved on that day
}

export interface SkillProgress {
  name: string;
  level: number; // 0-100
}

export interface SpacedRepetitionItem {
    topic: string;
    nextReviewDate: string; // "YYYY-MM-DD"
    lastReviewed: string; // "YYYY-MM-DD"
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: 'flame' | 'check-circle' | 'target' | 'award' | 'trophy';
}

export interface ProgressData {
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  rank: string;
  activity: ActivityLog[];
  skills: SkillProgress[];
  reviews: SpacedRepetitionItem[];
  achievements: Achievement[];
}