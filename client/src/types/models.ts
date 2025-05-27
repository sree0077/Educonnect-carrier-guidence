// TypeScript interfaces for College, Student, TestQuestion, TestResult
export interface College {
  id: string;
  name: string;
  location: string;
  courses: string[];
  fees: number;
  contact: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  appliedColleges: string[];
  testResults: TestResult[];
}

export interface TestQuestion {
  id: string;
  category: "verbal" | "quantitative" | "general_knowledge";
  question: string;
  options: string[];
  answer: string;
}

export interface TestResult {
  testId: string;
  score: number;
  date: string;
}
