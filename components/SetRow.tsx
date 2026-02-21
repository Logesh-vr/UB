
import React, { useRef, useEffect } from 'react';
import { SetRecord, MetricType } from '../types';

interface SetRowProps {
  index: number;
  data: SetRecord;
  updateSet: (updates: Partial<SetRecord>) => void;
  onComplete: () => void;
  autoFocus?: boolean;
}

const SetRow: React.FC<SetRowProps> = ({ index, data, updateSet, onComplete, autoFocus }) => {
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
    <div className={`p-5 tech-border transition-all duration-300 border-l-4 ${data.isCompleted
      ? 'bg-green-500/5 border-green-500/30 opacity-60 grayscale'
      : 'bg-black/20 border-green-500/20 shadow-sm'
      }`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-green-500/60 mono">
            CELL {index + 1}
          </span>
          {isTimed && (
            <span className="text-[7px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-sm font-black uppercase tracking-widest">
              TIMED
            </span>
          )}
        </div>
        <button
          onClick={() => updateSet({ isDropSet: !data.isDropSet })}
          className={`px-4 py-1.5 rounded-sm text-[8px] font-black uppercase transition-all tracking-widest ${data.isDropSet
            ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]'
            : 'bg-black/40 border border-green-500/20 text-green-500/60'
            }`}
        >
          {data.isDropSet ? 'DROP ACTIVE' : '+ INJECT DROP'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Main Set Inputs */}
        <div className="grid grid-cols-12 gap-4 items-end">
          {isTimed ? (
            <div className="col-span-10">
              <label className="block text-[7px] text-green-500/40 uppercase mb-2 font-black tracking-[0.2em]">PULSE DURATION (SECS)</label>
              <input
                ref={primaryInputRef}
                type="number"
                min="0"
                placeholder="0"
                className="w-full bg-black/40 border border-green-500/20 rounded-sm py-4 px-4 text-left text-2xl font-black focus:border-green-500 outline-none text-white tracking-tighter shadow-inner"
                value={data.metricValue}
                onChange={(e) => handleNumberChange('metricValue', e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="col-span-4">
                <label className="block text-[7px] text-green-500/40 uppercase mb-2 font-black tracking-[0.2em]">STRIKES</label>
                <input
                  ref={primaryInputRef}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="w-full bg-black/40 border border-green-500/20 rounded-sm py-4 px-2 text-center text-2xl font-black focus:border-green-500 outline-none text-white tracking-tighter shadow-inner"
                  value={data.reps}
                  onChange={(e) => handleNumberChange('reps', e.target.value)}
                />
              </div>
              <div className="col-span-6">
                <label className="block text-[7px] text-green-500/40 uppercase mb-2 font-black tracking-[0.2em]">LOAD ({data.metricType})</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  step="0.1"
                  className="w-full bg-black/40 border border-green-500/20 rounded-sm py-4 px-2 text-center text-2xl font-black focus:border-green-500 outline-none text-white tracking-tighter shadow-inner"
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
                className={`w-14 h-14 tech-border border-2 flex items-center justify-center transition-all active:scale-90 ${data.isCompleted
                  ? 'bg-green-500 border-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                  : 'bg-black/40 border-green-500/20 text-green-500/40'
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
          <div className="animate-in slide-in-from-top-2 duration-300 pt-5 mt-2 border-t border-dashed border-green-500/20">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-1 flex flex-col items-center justify-center pb-4">
                <div className="w-1 h-8 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>

              {isTimed ? (
                <div className="col-span-9">
                  <label className="block text-[7px] text-green-500/60 uppercase mb-2 font-black tracking-[0.2em] italic">RESONANCE DURATION</label>
                  <input
                    ref={dropInputRef}
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full bg-green-500/5 border border-green-500/30 rounded-sm py-4 px-4 text-left text-2xl font-black focus:border-green-500 outline-none text-white tracking-tighter"
                    value={data.dropMetricValue || ''}
                    onChange={(e) => handleNumberChange('dropMetricValue', e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className="col-span-4">
                    <label className="block text-[7px] text-green-500/60 uppercase mb-2 font-black tracking-[0.2em] italic">DROP STRIKES</label>
                    <input
                      ref={dropInputRef}
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full bg-green-500/5 border border-green-500/30 rounded-sm py-4 px-2 text-center text-2xl font-black focus:border-green-500 outline-none text-white tracking-tighter"
                      value={data.dropReps || ''}
                      onChange={(e) => handleNumberChange('dropReps', e.target.value)}
                    />
                  </div>
                  <div className="col-span-5">
                    <label className="block text-[7px] text-green-500/60 uppercase mb-2 font-black tracking-[0.2em] italic">DROP LOAD</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      step="0.1"
                      className="w-full bg-green-500/5 border border-green-500/30 rounded-sm py-4 px-2 text-center text-2xl font-black focus:border-green-500 outline-none text-white tracking-tighter"
                      value={data.dropMetricValue || ''}
                      onChange={(e) => handleNumberChange('dropMetricValue', e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="col-span-2 flex justify-end pb-[1px]">
                <button
                  onClick={onComplete}
                  className={`w-14 h-14 tech-border border-2 flex items-center justify-center transition-all active:scale-90 ${data.isCompleted
                    ? 'bg-green-500 border-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                    : 'bg-black/40 border-green-500/20 text-green-500/40'
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
