
import React, { useRef, useEffect } from 'react';
import { SetRecord, MetricType } from '../types';

interface SetRowProps {
  index: number;
  data: SetRecord;
  updateSet: (updates: Partial<SetRecord>) => void;
  onComplete: () => void;
  autoFocus?: boolean;
  isLoadOutMode?: boolean;
}

const SetRow: React.FC<SetRowProps> = ({ index, data, updateSet, onComplete, autoFocus, isLoadOutMode = false }) => {
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);
  const isTimed = data.metricType === MetricType.SECS;

  useEffect(() => {
    if (autoFocus && primaryInputRef.current) {
      primaryInputRef.current.focus();
    }
  }, [autoFocus]);

  // Focus drop input when drop set is enabled
  useEffect(() => {
    if (data.isDropSet && dropInputRef.current) {
      dropInputRef.current.focus();
    }
  }, [data.isDropSet]);

  const handleNumberChange = (field: keyof SetRecord, value: string) => {
    // Prevent negative numbers
    if (parseFloat(value) < 0) return;
    updateSet({ [field]: value });
  };

  return (
    <div className={`p-6 glass-panel transition-all duration-300 border-l-4 ${data.isCompleted
      ? 'opacity-60 grayscale'
      : `border-zinc-200 dark:border-zinc-800 shadow-sm`
      }`}
      style={!data.isCompleted ? { borderLeftColor: `var(--accent-${isLoadOutMode ? 'amber' : 'cyan'})` } : { borderLeftColor: '#71717a' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            SET {index + 1}
          </span>
          {isTimed && (
            <span className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${isLoadOutMode ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
              TIMED
            </span>
          )}
        </div>
        <button
          onClick={() => updateSet({ isDropSet: !data.isDropSet })}
          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all tracking-widest border ${data.isDropSet
            ? `${isLoadOutMode ? 'bg-amber-500 border-amber-500' : 'bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white'} text-white dark:text-black shadow-lg`
            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
            }`}
        >
          {data.isDropSet ? 'DROP ACTIVE' : '+ ADD DROP'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Main Set Inputs */}
        <div className="grid grid-cols-12 gap-4 items-end">
          {isTimed ? (
            <div className="col-span-10">
              <label className="block text-[8px] text-zinc-400 dark:text-zinc-500 uppercase mb-2 font-black tracking-widest ml-1">DURATION (SECONDS)</label>
              <input
                ref={primaryInputRef}
                type="number"
                min="0"
                placeholder="0"
                className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-4 px-5 text-left text-2xl font-black focus:ring-2 ring-zinc-500/10 outline-none text-zinc-900 dark:text-white tracking-tighter"
                value={data.metricValue}
                onChange={(e) => handleNumberChange('metricValue', e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="col-span-4">
                <label className="block text-[8px] text-zinc-400 dark:text-zinc-500 uppercase mb-2 font-black tracking-widest ml-1">REPS</label>
                <input
                  ref={primaryInputRef}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-4 px-2 text-center text-2xl font-black focus:ring-2 ring-zinc-500/10 outline-none text-zinc-900 dark:text-white tracking-tighter"
                  value={data.reps}
                  onChange={(e) => handleNumberChange('reps', e.target.value)}
                />
              </div>
              <div className="col-span-6">
                <label className="block text-[8px] text-zinc-400 dark:text-zinc-500 uppercase mb-2 font-black tracking-widest ml-1">WEIGHT ({data.metricType})</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  step="0.1"
                  className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-4 px-2 text-center text-2xl font-black focus:ring-2 ring-zinc-500/10 outline-none text-zinc-900 dark:text-white tracking-tighter"
                  value={data.metricValue}
                  onChange={(e) => handleNumberChange('metricValue', e.target.value)}
                />
              </div>
            </>
          )}

          <div className="col-span-2 flex justify-end pb-[1px]">
            {!data.isDropSet && (
              <button
                onClick={onComplete}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 ${data.isCompleted
                  ? `${isLoadOutMode ? 'bg-amber-500 border-amber-500' : 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'} text-white dark:text-black shadow-xl`
                  : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700'
                  }`}
              >
                {data.isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-3xl font-black">+</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Drop Set Inputs Row */}
        {data.isDropSet && (
          <div className="animate-in slide-in-from-top-2 duration-300 pt-5 mt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-1 flex flex-col items-center justify-center pb-4">
                <div className={`w-1 h-8 rounded-full ${isLoadOutMode ? 'bg-amber-500' : 'bg-cyan-500 shadow-lg'}`}></div>
              </div>

              {isTimed ? (
                <div className="col-span-9">
                  <label className="block text-[8px] text-zinc-400 uppercase mb-2 font-black tracking-widest ml-1 italic">DROP SECONDS</label>
                  <input
                    ref={dropInputRef}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-4 px-5 text-left text-2xl font-black outline-none text-zinc-900 dark:text-white tracking-tighter"
                    value={data.dropMetricValue || ''}
                    onChange={(e) => handleNumberChange('dropMetricValue', e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className="col-span-4">
                    <label className="block text-[8px] text-zinc-400 uppercase mb-2 font-black tracking-widest ml-1 italic">DROP REPS</label>
                    <input
                      ref={dropInputRef}
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-4 px-2 text-center text-2xl font-black outline-none text-zinc-900 dark:text-white tracking-tighter"
                      value={data.dropReps || ''}
                      onChange={(e) => handleNumberChange('dropReps', e.target.value)}
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="block text-[8px] text-zinc-400 uppercase mb-2 font-black tracking-widest ml-1 italic">DROP WEIGHT</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      step="0.1"
                      className="w-full bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-4 px-2 text-center text-2xl font-black outline-none text-zinc-900 dark:text-white tracking-tighter"
                      value={data.dropMetricValue || ''}
                      onChange={(e) => handleNumberChange('dropMetricValue', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="col-span-2 flex justify-end pb-[1px]">
                <button
                  onClick={onComplete}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-90 ${data.isCompleted
                    ? `${isLoadOutMode ? 'bg-amber-500 border-amber-500' : 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white'} text-white dark:text-black shadow-xl`
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700'
                    }`}
                >
                  {data.isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-3xl font-black">+</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetRow;
