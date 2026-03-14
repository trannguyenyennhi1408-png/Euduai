export type Role = 'teacher' | 'student' | null;
export type GameMode = 'standard' | 'survival' | 'speed' | 'homework';

export interface User {
  id: string;
  name: string;
  role: Role;
  streakDays: number;
  totalScore: number;
}

export interface Question {
  id: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  id: string;
  teacherId: string;
  title: string;
  questions: Question[];
  createdAt: number;
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  answers: Record<string, number>; // questionId -> optionIndex
  powerUps: {
    fiftyFifty: number;
    doubleScore: number;
  };
  lives?: number;
  isEliminated?: boolean;
  isFinished?: boolean;
}

export interface Room {
  id: string;
  code: string;
  teacherId: string;
  quizId: string;
  status: 'waiting' | 'playing' | 'finished';
  participants: Record<string, Participant>;
  currentQuestionIndex: number;
  startedAt?: number;
  gameMode: GameMode;
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  quizzes: Quiz[];
  rooms: Record<string, Room>;
  apiKey: string;
  lastUpdated?: number;
  
  // Actions
  setApiKey: (key: string) => void;
  login: (name: string, role: Role) => void;
  logout: () => void;
  
  // Teacher Actions
  createQuiz: (title: string, questions: Question[]) => void;
  deleteQuiz: (id: string) => void;
  createRoom: (quizId: string, gameMode: GameMode) => string;
  startRoom: (roomId: string) => void;
  nextQuestion: (roomId: string) => void;
  endRoom: (roomId: string) => void;
  
  // Student Actions
  joinRoom: (code: string, name: string) => string | null;
  submitAnswer: (roomId: string, questionId: string, answerIndex: number, isDoubleScore?: boolean, timeRemaining?: number) => void;
  usePowerUp: (roomId: string, type: 'fiftyFifty' | 'doubleScore') => void;
  finishHomework: (roomId: string) => void;
}
