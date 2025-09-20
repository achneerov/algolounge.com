export interface LanguageContent {
  template: string;
  solution_text?: string;
  solution_code?: string;
  convert_input?: string;
  test_code?: string;
}

export interface TestCase {
  id: number;
  input: Record<string, any>;
  output: any;
}

export interface Question {
  filename: string;
  title: string;
  keywords: string[];
  description: string;
  languages: Record<string, LanguageContent>;
  test_cases: TestCase[];
}