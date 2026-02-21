
import React, { useState, useRef } from 'react';
import { Exercise, SetRecord } from '../types';
import SetRow from './SetRow';

interface ExerciseLoggerProps {
  exercise: Exercise;
  initialSets?: SetRecord[];
  onUpdate?: (sets: SetRecord[]) => void;
}

const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({ exercise, initialSets, onUpdate }) => {
  const [sets, setSets] = useState<SetRecord[]>(
    initialSets || Array.from({ length: exercise.targetSets }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      reps: '',
      metricValue: '',
      dropReps: '',
      dropMetricValue: '',
      metricType: exercise.defaultMetric,
      isDropSet: false,
      isCompleted: false
    }))
  );

  const [activeSetIndex, setActiveSetIndex] = useState(0);

  const updateSet = (id: string, updates: Partial<SetRecord>) => {
    const nextSets = sets.map(s => s.id === id ? { ...s, ...updates } : s);
    setSets(nextSets);
    onUpdate?.(nextSets);
  };

  const completeSet = (index: number) => {
    const set = sets[index];
    updateSet(set.id, { isCompleted: !set.isCompleted });
    if (!set.isCompleted && index < sets.length - 1) {
      setActiveSetIndex(index + 1);
    }
  };

  const addSet = () => {
    if (sets.length >= 15) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const nextSets = [...sets, {
      id: newId,
      reps: '',
      metricValue: '',
      dropReps: '',
      dropMetricValue: '',
      metricType: exercise.defaultMetric,
      isDropSet: false,
      isCompleted: false
    }];
    setSets(nextSets);
    onUpdate?.(nextSets);
    setActiveSetIndex(sets.length);
  };

  const removeSet = () => {
    if (sets.length <= 1) return;
    const nextSets = sets.slice(0, -1);
    setSets(nextSets);
    onUpdate?.(nextSets);
  };

  return (
    <div className="space-y-4">
      {sets.map((set, idx) => (
        <SetRow
          key={set.id}
          index={idx}
          data={set}
          updateSet={(updates) => updateSet(set.id, updates)}
          onComplete={() => completeSet(idx)}
          autoFocus={idx === activeSetIndex}
        />
      ))}

      <div className="flex gap-2">
        <button
          onClick={addSet}
          className="flex-1 tech-border bg-green-500 text-black py-4 font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-400 transition-all active:scale-[0.98]"
        >
          Inject Set
        </button>
        {sets.length > 1 && (
          <button
            onClick={removeSet}
            className="px-6 tech-border bg-black/40 border border-green-500/20 text-green-500 hover:text-red-500 transition-all active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ExerciseLogger;
