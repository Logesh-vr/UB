
export enum MetricType {
  KG = 'KG',
  PLATES = 'PLATES',
  SECS = 'SECS'
}

export enum MuscleGroup {
  CHEST = 'CHEST',
  BACK = 'BACK',
  SHOULDERS = 'SHOULDERS',
  BICEPS = 'BICEPS',
  TRICEPS = 'TRICEPS',
  QUADS = 'QUADS',
  HAMSTRINGS = 'HAMSTRINGS',
  GLUTES = 'GLUTES',
  CALVES = 'CALVES',
  CORE = 'CORE'
}

export type ExerciseRelation = 'NONE' | 'AND' | 'OR';

export interface SetRecord {
  id: string;
  reps: string;
  metricValue: string;
  dropReps?: string;
  dropMetricValue?: string;
  metricType: MetricType;
  isDropSet: boolean;
  isCompleted: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  targetSets: number | null;
  defaultMetric: MetricType;
  relation: ExerciseRelation;
  partnerName?: string;
  partnerMetric?: MetricType;
  primaryMuscle?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
}

export interface WorkoutSession {
  id: string;
  title: string;
  subtitle: string;
  exercises: Exercise[];
}

export interface PersonalRecords {
  bench: string;
  squat: string;
  deadlift: string;
}

export interface LeaderboardEntry {
  username: string;
  bench: number;
  squat: number;
  deadlift: number;
  total: number;
}

export type ViewType = 'HOME' | 'WORKOUT' | 'HISTORY' | 'STATS' | 'PLAN_EDITOR' | 'EXERCISE_DETAIL' | 'LOAD_OUT' | 'PROFILE' | 'LEADERBOARD';

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetRecord[];
  timestamp: number;
}

export interface WorkoutLog {
  id: string;
  workoutTitle: string;
  date: string;
  timestamp: number;
  exercises: ExerciseLog[];
  isLoadOut: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  age?: string;
  weight?: string;
  height?: string;
  goal?: string;
  experience?: string;
}
