
import { WorkoutSession, MetricType, MuscleGroup } from './types';

export const PPL_ROUTINE: WorkoutSession[] = [
  {
    id: 'push-a',
    title: 'Push Day',
    subtitle: 'Session A - Strength',
    exercises: [
      { id: '1', name: 'Barbell Bench Press', relation: 'OR', partnerName: 'DB Chest Press', targetSets: 4, defaultMetric: MetricType.KG, partnerMetric: MetricType.KG, primaryMuscle: MuscleGroup.CHEST, secondaryMuscles: [MuscleGroup.SHOULDERS, MuscleGroup.TRICEPS] },
      { id: '2', name: 'Overhead Press', relation: 'NONE', targetSets: 3, defaultMetric: MetricType.KG, primaryMuscle: MuscleGroup.SHOULDERS, secondaryMuscles: [MuscleGroup.TRICEPS] },
      // Fixed: partnerMetric was incorrectly assigned MuscleGroup.TRICEPS instead of a MetricType (KG)
      { id: '4', name: 'Tricep Pushdowns', relation: 'AND', partnerName: 'Lateral Raises', targetSets: 3, defaultMetric: MetricType.PLATES, partnerMetric: MetricType.KG, primaryMuscle: MuscleGroup.TRICEPS, secondaryMuscles: [MuscleGroup.SHOULDERS] },
    ]
  },
  {
    id: 'pull-a',
    title: 'Pull Day',
    subtitle: 'Session A - Back',
    exercises: [
      { id: '6', name: 'Weighted Pull Ups', relation: 'OR', partnerName: 'Lat Pulldowns', targetSets: 4, defaultMetric: MetricType.KG, partnerMetric: MetricType.PLATES, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS] },
      { id: '7', name: 'Barbell Row', relation: 'NONE', targetSets: 3, defaultMetric: MetricType.KG, primaryMuscle: MuscleGroup.BACK, secondaryMuscles: [MuscleGroup.BICEPS] },
      { id: '9', name: 'Bicep Curls', relation: 'AND', partnerName: 'Hammer Curls', targetSets: 3, defaultMetric: MetricType.KG, partnerMetric: MetricType.KG, primaryMuscle: MuscleGroup.BICEPS },
    ]
  },
  {
    id: 'legs-a',
    title: 'Leg Day',
    subtitle: 'Session A - Lower',
    exercises: [
      { id: '11', name: 'Back Squat', relation: 'NONE', targetSets: 4, defaultMetric: MetricType.KG, primaryMuscle: MuscleGroup.QUADS, secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS] },
      { id: '12', name: 'Leg Press', relation: 'OR', partnerName: 'Hack Squat', targetSets: 3, defaultMetric: MetricType.PLATES, partnerMetric: MetricType.PLATES, primaryMuscle: MuscleGroup.QUADS, secondaryMuscles: [MuscleGroup.GLUTES] },
      { id: '13', name: 'Leg Extensions', relation: 'AND', partnerName: 'Sissy Squat', targetSets: 3, defaultMetric: MetricType.KG, partnerMetric: MetricType.KG, primaryMuscle: MuscleGroup.QUADS },
    ]
  }
];
