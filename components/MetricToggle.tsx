
import React from 'react';
import { MetricType } from '../types';

interface MetricToggleProps {
  value: MetricType;
  onChange: (type: MetricType) => void;
}

const MetricToggle: React.FC<MetricToggleProps> = ({ value, onChange }) => {
  const options = [MetricType.KG, MetricType.PLATES, MetricType.SECS];

  return (
    <div className="flex bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700 w-full transition-colors">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`flex-1 py-1 text-[9px] font-bold uppercase tracking-wider transition-all rounded-md ${
            value === option 
              ? 'bg-cyan-500 text-black shadow-sm' 
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          {option === MetricType.PLATES ? 'PLT' : option}
        </button>
      ))}
    </div>
  );
};

export default MetricToggle;
