export type QuestionType = 'mcq-single' | 'mcq-multiple' | 'short-answer' | 'long-answer';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
  difficultyLevel: DifficultyLevel;
  categories: string[];
  createdAt: number;
  updatedAt: number;
}

export const questionTypeLabels: Record<QuestionType, string> = {
  'mcq-single': 'Multiple Choice (Single Answer)',
  'mcq-multiple': 'Multiple Choice (Multiple Answers)',
  'short-answer': 'Short Answer',
  'long-answer': 'Long Answer',
};

export const difficultyLevelLabels: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};
