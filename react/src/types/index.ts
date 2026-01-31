// User types
export interface User {
  id: number;
  username: string;
  email: string;
  roleId: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Question types
export interface TestCase {
  id: number;
  input: Record<string, unknown>;
  output: unknown;
}

export interface Question {
  index?: number;
  filename: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  keywords: string[];
  description: string;
  entry_function: string;
  template: string;
  solution_text: string;
  solution_code: string;
  prepare: string;
  verify: string;
  test_cases: TestCase[];
}

export interface QuestionSearchResult {
  filename: string;
  title: string;
  difficulty: string;
  tags: string[];
  keywords: string[];
  score: number;
}

// Course types
export interface CourseUrl {
  url: string;
  tooltip: string;
  color: string;
  visibleString?: string;
}

export interface CourseQuestion {
  filename: string;
  urls?: CourseUrl[];
}

export interface CourseUnit {
  title: string;
  description?: string;
  questions: CourseQuestion[];
}

export interface Course {
  filename: string;
  course_name: string;
  course_description: string;
  keywords?: string[];
  badge?: string;
  units: Record<string, CourseUnit>;
}

export interface CourseSearchResult {
  filename: string;
  title: string;
  description: string;
  keywords: string[];
  score: number;
}

// Execution types
export interface TestResult {
  id: number;
  input: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  passed: boolean;
  error?: string;
  output?: string[];
}

export interface ExecutionResult {
  testResults: TestResult[];
  executionTime: number;
  passedCount: number;
  totalCount: number;
  output: string[];
}

// Tag types
export interface Tag {
  text: string;
  color: string;
}

export interface TagConfig {
  difficulties: Record<string, string>;
  tags: Record<string, string>;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';
