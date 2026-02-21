import React, { useState, useEffect, useMemo } from 'react';
import { ViewType, WorkoutSession, Exercise, PersonalRecords, MetricType, ExerciseRelation, MuscleGroup, WorkoutLog, LeaderboardEntry } from './types';
import { PPL_ROUTINE } from './constants';
import ExerciseLogger from './components/ExerciseLogger';
import MetricToggle from './components/MetricToggle';
import MuscleMap from './components/MuscleMap';
import AuthScreen from './components/AuthScreen';

const STORAGE_KEY = 'ub_user_routine_v1';
const PR_STORAGE_KEY = 'ub_prs';
const THEME_STORAGE_KEY = 'ub_theme';
const DELOAD_STORAGE_KEY = 'ub_deload_mode';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
// Robust URL resolution for environment variables
const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  // Ensure we have the /api suffix if not present
  if (!url.endsWith('/api')) {
    url = `${url.replace(/\/$/, '')}/api`;
  }
  return url;
};
const API_BASE_URL = getApiUrl();

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('HOME');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [focusedExercise, setFocusedExercise] = useState<Exercise | null>(null);
  const [userRoutine, setUserRoutine] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<PersonalRecords>({ bench: '0', squat: '0', deadlift: '0' });
  const [token, setToken] = useState<string | null>(localStorage.getItem('ub_auth_token'));

  const [todaySession, setTodaySession] = useState<WorkoutSession | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [isEditingPrs, setIsEditingPrs] = useState(false);
  const [isLoadOutMode, setIsLoadOutMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEditDayIdx, setSelectedEditDayIdx] = useState(0);

  const [selectedOrId, setSelectedOrId] = useState<'PRIMARY' | 'PARTNER'>('PRIMARY');
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
  const [currentSessionResults, setCurrentSessionResults] = useState<Record<string, any[]>>({});
  const [hasSynced, setHasSynced] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardSortField, setLeaderboardSortField] = useState<'total' | 'bench' | 'squat' | 'deadlift'>('total');

  // Storage keys
  const HISTORY_STORAGE_KEY = 'ub_workout_history';

  // Calculate Muscle Intensities based on the Routine Volume
  const muscleIntensities = useMemo(() => {
    const scores: Record<MuscleGroup, number> = {} as any;
    Object.values(MuscleGroup).forEach(g => scores[g] = 0);

    userRoutine.forEach(session => {
      session.exercises.forEach(ex => {
        if (ex.primaryMuscle) {
          scores[ex.primaryMuscle] += (ex.targetSets || 0);
        }
        ex.secondaryMuscles?.forEach(sec => {
          scores[sec] += (ex.targetSets || 0) * 0.5; // Secondary gets half weight
        });
      });
    });

    // Normalize (Assume 20 sets per muscle group is "Max Intensity" for visual scaling)
    const normalized: Record<MuscleGroup, number> = {} as any;
    Object.entries(scores).forEach(([group, score]) => {
      normalized[group as MuscleGroup] = Math.min(score / 20, 1);
    });
    return normalized;
  }, [userRoutine]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const dark = savedTheme === null ? true : savedTheme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const savedDeload = localStorage.getItem(DELOAD_STORAGE_KEY);
    setIsLoadOutMode(savedDeload === 'true');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const themeStr = next ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, themeStr);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // Sync to backend
    if (token) {
      fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_load_out: isLoadOutMode, theme: themeStr })
      }).catch(e => console.error("Failed to save theme to backend:", e));
    }
  };

  const toggleLoadOut = () => {
    const next = !isLoadOutMode;
    setIsLoadOutMode(next);
    localStorage.setItem(DELOAD_STORAGE_KEY, next.toString());
    setIsSidebarOpen(false);

    // Sync to backend
    if (token) {
      fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_load_out: next, theme: isDark ? 'dark' : 'light' })
      }).catch(e => console.error("Failed to save settings to backend:", e));
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setLeaderboard(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    }
  };

  const handleLogin = (newToken: string) => {
    localStorage.setItem('ub_auth_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    // 1. Purge all LocalStorage identity and data keys
    localStorage.removeItem('ub_auth_token');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PR_STORAGE_KEY);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    localStorage.removeItem(THEME_STORAGE_KEY);
    localStorage.removeItem(DELOAD_STORAGE_KEY);

    // 2. Clear Token (this triggers AuthScreen)
    setToken(null);
    setIsSidebarOpen(false);

    // 3. Reset ALL state to sterile defaults
    setWorkoutHistory([]);
    setCurrentSessionResults({});
    setUserRoutine(initializeRoutine(PPL_ROUTINE));
    setPrs({ bench: '0', squat: '0', deadlift: '0' });
    setIsLoadOutMode(false);
    setHasSynced(false);
    setCurrentView('HOME');
  };

  const navigateTo = (view: ViewType) => {
    if (view === 'LEADERBOARD') fetchLeaderboard();
    setCurrentView(view);
    setIsSidebarOpen(false);
    if (view === 'PLAN_EDITOR') {
      const today = new Date().getDay();
      setSelectedEditDayIdx(today === 0 ? 0 : today - 1);
    }
  };

  const initializeRoutine = (data: WorkoutSession[]): WorkoutSession[] => {
    const fullRoutine = [...data];
    while (fullRoutine.length < 6) {
      const idx = fullRoutine.length;
      fullRoutine.push({
        id: `day-${idx}`,
        title: DAYS[idx],
        subtitle: 'Custom Session',
        exercises: []
      });
    }
    return fullRoutine.slice(0, 6);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      // 1. CLEAR LOCAL STATE FIRST to ensure no cross-user contamination
      setWorkoutHistory([]);
      setUserRoutine(initializeRoutine(PPL_ROUTINE));
      setPrs({ bench: '0', squat: '0', deadlift: '0' });
      setHasSynced(false);

      // 2. Load from LocalStorage for speed (only if it exists)
      const savedRoutine = localStorage.getItem(STORAGE_KEY);
      if (savedRoutine) {
        try {
          const parsed = JSON.parse(savedRoutine);
          setUserRoutine(initializeRoutine(parsed));
        } catch (e) { }
      }

      const savedPrs = localStorage.getItem(PR_STORAGE_KEY);
      if (savedPrs) try { setPrs(JSON.parse(savedPrs)); } catch (e) { }

      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) try { setWorkoutHistory(JSON.parse(savedHistory)); } catch (e) { }

      // Then sync from FastAPI
      try {
        const [routineRes, prsRes, historyRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/routine`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/prs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (routineRes.status === 401) {
          handleLogout();
          return;
        }

        if (routineRes.ok) {
          const routineData = await routineRes.json();
          // If the cloud has data, it wins. If NOT, we keep the default/local.
          if (routineData && routineData.length > 0) {
            setUserRoutine(initializeRoutine(routineData));
          } else {
            // Cloud is empty -> Wipe local routine to default (prevents inheritance)
            setUserRoutine(initializeRoutine(PPL_ROUTINE));
          }
        }

        if (prsRes.ok) {
          const prsData = await prsRes.json();
          if (prsData && (prsData.bench !== "0" || prsData.squat !== "0" || prsData.deadlift !== "0")) {
            setPrs(prsData);
          } else {
            // Cloud is empty -> Wipe local PRs (prevents inheritance)
            setPrs({ bench: '0', squat: '0', deadlift: '0' });
          }
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData && historyData.length > 0) {
            setWorkoutHistory(historyData);
          } else {
            setWorkoutHistory([]);
          }
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData) {
            if (settingsData.is_load_out !== undefined) {
              setIsLoadOutMode(settingsData.is_load_out);
              localStorage.setItem(DELOAD_STORAGE_KEY, settingsData.is_load_out.toString());
            }
            if (settingsData.theme) {
              const isDarkTheme = settingsData.theme === 'dark';
              setIsDark(isDarkTheme);
              localStorage.setItem(THEME_STORAGE_KEY, settingsData.theme);
              if (isDarkTheme) document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            }
          }
        }

        setHasSynced(true);
      } catch (error) {
        console.error("Failed to sync with backend:", error);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    if (token && hasSynced && userRoutine.length === 6) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userRoutine));
      fetch(`${API_BASE_URL}/routine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userRoutine)
      }).catch(e => console.error("Failed to save routine to backend:", e));
    }
  }, [userRoutine, token, hasSynced]);

  useEffect(() => {
    if (token && hasSynced) {
      localStorage.setItem(PR_STORAGE_KEY, JSON.stringify(prs));
      // Only auto-sync PRs if NOT in manual edit mode (to prevent noisy updates)
      if (!isEditingPrs) {
        fetch(`${API_BASE_URL}/prs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(prs)
        }).catch(e => console.error("Failed to save PRs to backend:", e));
      }
    }
  }, [prs, token, isEditingPrs, hasSynced]);

  useEffect(() => {
    if (userRoutine.length < 6) return;
    const dayIndex = new Date().getDay();
    if (dayIndex === 0) setTodaySession(null);
    else setTodaySession(userRoutine[dayIndex - 1]);
  }, [userRoutine]);

  const updateExerciseProperty = (dayIdx: number, exId: string, updates: Partial<Exercise>) => {
    setUserRoutine(prev => {
      const next = [...prev];
      const day = { ...next[dayIdx] };
      day.exercises = day.exercises.map(ex => ex.id === exId ? { ...ex, ...updates } : ex);
      next[dayIdx] = day;
      return next;
    });
  };

  const addExercise = (dayIdx: number) => {
    setUserRoutine(prev => {
      const next = [...prev];
      const day = { ...next[dayIdx] };
      day.exercises = [...day.exercises, {
        id: Math.random().toString(36).substr(2, 9),
        name: 'New Exercise',
        relation: 'NONE',
        targetSets: null,
        defaultMetric: MetricType.KG
      }];
      next[dayIdx] = day;
      return next;
    });
  };

  const handleExerciseClick = (ex: Exercise) => {
    setSelectedOrId('PRIMARY');
    setFocusedExercise(ex);
    setCurrentView('EXERCISE_DETAIL');
  };

  const handleSessionUpdate = (exId: string, sets: any[]) => {
    setCurrentSessionResults(prev => ({
      ...prev,
      [exId]: sets
    }));
  };

  const finishWorkout = async () => {
    if (!activeWorkout || !token) {
      setCurrentView('HOME');
      return;
    }

    const logEntry = {
      workoutTitle: activeWorkout.title,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      isLoadOut: isLoadOutMode,
      exercises: Object.entries(currentSessionResults).map(([exId, sets]) => ({
        exerciseId: exId,
        exerciseName: activeWorkout.exercises.find(e => e.id === exId)?.name || 'Unknown',
        sets: (sets as any[]).filter((s: any) => s.isCompleted),
        timestamp: Date.now()
      })).filter(ex => ex.sets.length > 0)
    };

    if (logEntry.exercises.length > 0) {
      try {
        const res = await fetch(`${API_BASE_URL}/history`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(logEntry)
        });

        if (res.ok) {
          const updatedHistory = [logEntry as any, ...workoutHistory];
          setWorkoutHistory(updatedHistory);
          localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
        }
      } catch (error) {
        console.error("Failed to save workout history:", error);
      }
    }

    setCurrentSessionResults({});
    setActiveWorkout(null);
    setCurrentView('HOME');
  };

  const accentColorClass = isLoadOutMode ? 'text-amber-500' : 'text-cyan-500';
  const accentBgClass = isLoadOutMode ? 'bg-amber-500' : 'bg-cyan-500';

  const Header = ({ title, showLogo = false }: { title: string, showLogo?: boolean }) => (
    <header className="sticky top-0 z-[60] flex items-center justify-between mb-8 px-5 py-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 -mx-6">
      <div className="flex items-center gap-3">
        {showLogo ? (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden active:scale-95 transition-transform bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800`}
          >
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentView('HOME')}
            className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 active:scale-95 transition-transform"
          >
            ←
          </button>
        )}
        <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tighter">{title}</h1>
      </div>
      {!showLogo && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-10 h-10 flex-shrink-0 glass-panel border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white active:scale-95 transition-transform overflow-hidden"
        >
          <div className={`w-full h-full ${accentBgClass} flex items-center justify-center text-[10px] font-black italic`}>
            ID
          </div>
        </button>
      )}
    </header>
  );

  const renderHome = () => (
    <div className="p-6 pt-0 space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
      <Header title="Dashboard" showLogo />

      {isLoadOutMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
          <div className="bg-amber-500 text-black p-1.5 rounded-lg font-black text-[10px] uppercase">Active</div>
          <div>
            <h4 className="font-black uppercase text-amber-500 text-xs tracking-widest">Load Out Week</h4>
            <p className="text-[10px] text-amber-600/80 font-bold uppercase">Focus: Technique & Recovery</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {Object.entries(prs).map(([key, val]) => (
          <div key={key} className="glass-panel p-4 rounded-3xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800 transition-all active:scale-95 shadow-sm">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-2">{key}</span>
            {isEditingPrs ? (
              <input
                type="number" min="0"
                className="w-full bg-transparent border-none text-center font-black text-xl italic outline-none text-zinc-900 dark:text-white"
                value={val}
                onChange={(e) => {
                  if (parseFloat(e.target.value) < 0) return;
                  setPrs(prev => ({ ...prev, [key]: e.target.value }));
                }}
              />
            ) : (
              <span className={`text-2xl font-black italic tracking-tighter mono ${isLoadOutMode ? 'text-zinc-400' : 'text-zinc-900 dark:text-white'}`}>{val}</span>
            )}
          </div>
        ))}
        <div className="col-span-3 flex justify-end">
          <button onClick={() => setIsEditingPrs(!isEditingPrs)} className={`text-[10px] font-black uppercase tracking-tighter ${accentColorClass}`}>
            {isEditingPrs ? 'Save PRs' : 'Modify PRs'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs">Today's Protocol</h2>
          {todaySession && (
            <button
              onClick={() => { setActiveWorkout(todaySession); setCurrentView('WORKOUT'); }}
              className={`text-white dark:text-black px-4 py-1.5 rounded-lg text-[10px] font-black uppercase italic tracking-tighter shadow-xl active:scale-95 transition-all ${isLoadOutMode ? 'bg-amber-500' : 'bg-zinc-900 dark:bg-white'}`}
            >
              Execute
            </button>
          )}
        </div>

        {todaySession ? (
          <div className="space-y-4">
            {todaySession.exercises.map((ex, idx) => (
              <button key={ex.id} onClick={() => handleExerciseClick(ex)} className={`w-full glass-panel p-6 rounded-3xl flex items-center justify-between group transition-all active:scale-[0.97] border border-zinc-200 dark:border-zinc-800 shadow-sm ${ex.relation === 'AND' ? 'border-purple-500/30 bg-purple-500/5' : ex.relation === 'OR' ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                <div className="flex gap-4 items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${accentBgClass} text-white dark:text-black shadow-lg`}>
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-lg">{ex.name}</h4>
                      {ex.relation === 'AND' && <span className="text-[10px] text-purple-500 font-black italic">+ {ex.partnerName}</span>}
                      {ex.relation === 'OR' && <span className="text-[10px] text-amber-500 font-black italic">/ {ex.partnerName}</span>}
                    </div>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">{ex.targetSets || 0} Sets • {ex.relation !== 'NONE' ? (ex.relation === 'AND' ? 'Superset' : 'Alternative') : ex.defaultMetric}</span>
                    </div>
                  </div>
                </div>
                <div className={`text-zinc-300 dark:text-zinc-800 group-active:${accentColorClass} transition-colors`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center text-center">
            <h1 className="text-4xl font-black text-zinc-300 dark:text-zinc-800 uppercase italic tracking-tighter">System Idle</h1>
            <p className="text-zinc-500 dark:text-zinc-600 text-sm">Active recovery protocol engaged.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPlanEditor = () => (
    <div className="p-6 pt-0 space-y-6 animate-in fade-in slide-in-from-right-10 duration-500 pb-32">
      <Header title="Routine Plan" />
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        {SHORT_DAYS.map((day, idx) => (
          <button
            key={day}
            onClick={() => setSelectedEditDayIdx(idx)}
            className={`flex-shrink-0 px-4 py-3 rounded-xl font-black text-xs transition-all border ${selectedEditDayIdx === idx
              ? `${accentBgClass} text-white dark:text-black border-transparent shadow-lg shadow-cyan-500/20`
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
          >
            {day}
          </button>
        ))}
      </div>
      <div className="space-y-6">
        <section key={DAYS[selectedEditDayIdx]} className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-4">
            <span className={`${accentColorClass} mono font-bold text-lg`}>0{selectedEditDayIdx + 1}</span>
            <h3 className="text-xl font-black uppercase tracking-tight italic">{DAYS[selectedEditDayIdx]}</h3>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
          </div>
          <div className="space-y-4">
            {userRoutine[selectedEditDayIdx]?.exercises.map((ex) => (
              <div key={ex.id} className="bg-zinc-50 dark:bg-zinc-900/40 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-5 shadow-sm active:scale-[0.99] transition-transform">
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <div className={`w-1 h-8 rounded-full ${accentBgClass}`}></div>
                    <input
                      type="text" value={ex.name}
                      onChange={(e) => updateExerciseProperty(selectedEditDayIdx, ex.id, { name: e.target.value })}
                      placeholder="Exercise Name"
                      className="flex-1 bg-transparent border-none outline-none font-bold text-lg text-zinc-900 dark:text-white"
                    />
                    <button onClick={() => {
                      const next = [...userRoutine];
                      next[selectedEditDayIdx].exercises = next[selectedEditDayIdx].exercises.filter(eItem => eItem.id !== ex.id);
                      setUserRoutine(next);
                    }} className="text-zinc-400 hover:text-red-500 p-2 text-2xl transition-colors">×</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Global Sets</span>
                      <input
                        type="number" min="1"
                        value={ex.targetSets ?? ''}
                        onChange={(e) => updateExerciseProperty(selectedEditDayIdx, ex.id, { targetSets: e.target.value === '' ? null : parseInt(e.target.value) })}
                        className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg py-1.5 text-center font-bold h-[32px] text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Primary Unit</span>
                      <MetricToggle value={ex.defaultMetric} onChange={(m) => updateExerciseProperty(selectedEditDayIdx, ex.id, { defaultMetric: m })} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Slot Type</span>
                  <div className="flex bg-zinc-200 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-300 dark:border-zinc-700">
                    <button onClick={() => updateExerciseProperty(selectedEditDayIdx, ex.id, { relation: 'NONE' })} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded ${ex.relation === 'NONE' ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>Single</button>
                    <button onClick={() => updateExerciseProperty(selectedEditDayIdx, ex.id, { relation: 'AND', partnerName: ex.partnerName || 'Secondary' })} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded ${ex.relation === 'AND' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-500'}`}>AND</button>
                    <button onClick={() => updateExerciseProperty(selectedEditDayIdx, ex.id, { relation: 'OR', partnerName: ex.partnerName || 'Alternative' })} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded ${ex.relation === 'OR' ? 'bg-amber-600 text-white shadow-sm' : 'text-zinc-500'}`}>OR</button>
                  </div>
                </div>
                {ex.relation !== 'NONE' && (
                  <div className={`p-4 rounded-xl space-y-4 border-l-4 shadow-inner animate-in slide-in-from-top-2 ${ex.relation === 'AND' ? 'bg-purple-500/5 border-purple-500/50' : 'bg-amber-500/5 border-amber-500/50'
                    }`}>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Partner Movement</span>
                      <input
                        type="text" value={ex.partnerName || ''}
                        onChange={(e) => updateExerciseProperty(selectedEditDayIdx, ex.id, { partnerName: e.target.value })}
                        placeholder="Partner Name"
                        className="w-full bg-transparent border-none outline-none font-bold text-lg placeholder:text-zinc-400 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Partner Unit</span>
                      <MetricToggle value={ex.partnerMetric || MetricType.KG} onChange={(m) => updateExerciseProperty(selectedEditDayIdx, ex.id, { partnerMetric: m })} />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => addExercise(selectedEditDayIdx)} className="w-full py-5 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-zinc-400 text-xs font-black uppercase tracking-widest transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98]">
              + New Movement Slot
            </button>
          </div>
        </section>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-6 glass-panel border-t border-zinc-200 dark:border-zinc-800 z-50">
        <button onClick={() => setCurrentView('HOME')} className={`w-full text-white dark:text-black font-black uppercase py-4 rounded-xl text-lg shadow-xl active:scale-95 transition-all ${accentBgClass}`}>
          Save Configuration
        </button>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="p-6 pt-0 space-y-8 animate-in fade-in slide-in-from-right-10 duration-500 pb-32">
      <Header title="Bio-Signals" />

      <div className="glass-panel p-6 rounded-3xl space-y-6 relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Anatomical Heatmap</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Weekly Cumulative Intensity</p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-2xl font-black mono italic ${accentColorClass}`}>7D</span>
            <span className="text-[8px] text-zinc-400 font-bold uppercase">Window</span>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Anatomical Model */}
          <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 py-4">
            <MuscleMap intensities={muscleIntensities} />
          </div>

          {/* Intensity Legend */}
          <div className="w-20 flex flex-col justify-end gap-3 pb-4">
            <div className="space-y-1">
              <div className="h-12 w-full bg-cyan-400 rounded-lg"></div>
              <span className="text-[7px] font-black text-zinc-400 uppercase tracking-tighter block text-center">Peak</span>
            </div>
            <div className="space-y-1">
              <div className="h-12 w-full bg-cyan-600 rounded-lg"></div>
              <span className="text-[7px] font-black text-zinc-400 uppercase tracking-tighter block text-center">High</span>
            </div>
            <div className="space-y-1">
              <div className="h-12 w-full bg-cyan-900 rounded-lg"></div>
              <span className="text-[7px] font-black text-zinc-400 uppercase tracking-tighter block text-center">Low</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Top Targeted Groups</h4>
        <div className="grid grid-cols-1 gap-2">
          {(Object.entries(muscleIntensities) as [MuscleGroup, number][])
            .filter(([_, val]) => val > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([group, val]) => (
              <div key={group} className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest">{group}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`${accentBgClass} h-full transition-all duration-1000`}
                      style={{ width: `${val * 100}%` }}
                    ></div>
                  </div>
                  <span className="mono text-[10px] font-bold text-zinc-500">{(val * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="p-6 pt-0 space-y-8 animate-in fade-in slide-in-from-right-10 duration-500 pb-32">
      <Header title="Archive Logs" />

      {workoutHistory.length === 0 ? (
        <div className="py-20 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center text-3xl opacity-20 border border-green-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">📋</div>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-zinc-400">Archive Empty</h3>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Awaiting First Entry...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {workoutHistory.map((log: WorkoutLog) => (
            <div key={log.id} className="glass-panel p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-black uppercase italic text-lg tracking-tight">{log.workoutTitle}</h3>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">{log.date}</span>
                </div>
                {log.isLoadOut && <span className="text-[8px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-black uppercase">Load Out</span>}
              </div>
              <div className="space-y-2">
                {log.exercises.map((ex, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-zinc-500 uppercase">{ex.exerciseName}</span>
                    <span className="mono text-zinc-900 dark:text-zinc-300">{ex.sets.length} Sets</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLoggerView = () => {
    if (!focusedExercise) return null;

    return (
      <div className="p-6 pt-0 pb-32 animate-in fade-in slide-in-from-right-10 duration-500">
        <Header title={selectedOrId === 'PRIMARY' ? focusedExercise.name : focusedExercise.partnerName!} />

        <div className="flex flex-col items-center mb-8 -mt-4">
          <p className={`text-[10px] font-black uppercase italic tracking-[0.3em] ${accentColorClass}`}>
            {isLoadOutMode ? 'Active Recovery Monitor' : 'Intensity Tracking Active'}
          </p>
        </div>

        {isLoadOutMode && (
          <div className="mb-6 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center">
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">Target: Maintenance Load Only</span>
          </div>
        )}

        {focusedExercise.relation === 'OR' && (
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl mb-8 border border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setSelectedOrId('PRIMARY')}
              className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase transition-all truncate ${selectedOrId === 'PRIMARY' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500'}`}
            >
              {focusedExercise.name}
            </button>
            <button
              onClick={() => setSelectedOrId('PARTNER')}
              className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase transition-all truncate ${selectedOrId === 'PARTNER' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500'}`}
            >
              {focusedExercise.partnerName}
            </button>
          </div>
        )}

        {focusedExercise.relation === 'AND' ? (
          <div className="space-y-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500 px-2 flex items-center gap-2">
                Superset Protocol
              </h3>
              <div className="space-y-8">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">1. {focusedExercise.name}</h4>
                  <ExerciseLogger
                    exercise={{ ...focusedExercise, relation: 'NONE' }}
                    onUpdate={(sets) => handleSessionUpdate(focusedExercise.id, sets)}
                    initialSets={currentSessionResults[focusedExercise.id]}
                  />
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">2. {focusedExercise.partnerName}</h4>
                  <ExerciseLogger
                    exercise={{ ...focusedExercise, name: focusedExercise.partnerName!, defaultMetric: focusedExercise.partnerMetric!, relation: 'NONE' }}
                    onUpdate={(sets) => handleSessionUpdate(`${focusedExercise.id}-partner`, sets)}
                    initialSets={currentSessionResults[`${focusedExercise.id}-partner`]}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ExerciseLogger
            key={`${focusedExercise.id}-${selectedOrId}`}
            exercise={selectedOrId === 'PRIMARY' ? focusedExercise : { ...focusedExercise, name: focusedExercise.partnerName!, defaultMetric: focusedExercise.partnerMetric! }}
            onUpdate={(sets) => handleSessionUpdate(selectedOrId === 'PRIMARY' ? focusedExercise.id : `${focusedExercise.id}-partner`, sets)}
            initialSets={currentSessionResults[selectedOrId === 'PRIMARY' ? focusedExercise.id : `${focusedExercise.id}-partner`]}
          />
        )}

        <div className="fixed bottom-0 left-0 right-0 p-6 glass-panel border-t border-zinc-200 dark:border-zinc-800 z-50">
          <button onClick={() => setCurrentView('HOME')} className={`w-full text-white font-black uppercase py-4 rounded-xl text-lg shadow-xl active:scale-95 transition-all ${isLoadOutMode ? 'bg-amber-600' : 'bg-cyan-600'}`}>Complete Slot</button>
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => {
    const getSortedLeaderboard = () => {
      return [...leaderboard].sort((a, b) => (b[leaderboardSortField] as number) - (a[leaderboardSortField] as number));
    };

    const sortedData = getSortedLeaderboard();

    return (
      <div className="p-6 pt-0 space-y-8 animate-in fade-in slide-in-from-right-10 duration-500 pb-32">
        <div className="flex justify-between items-center">
          <Header title="Leaderboard Matrix" />
          <button
            onClick={fetchLeaderboard}
            className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm active:scale-95 transition-all outline-none"
          >
            🔄
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Global Ranking</h3>
            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-loose">Real-time Persistence</span>
          </div>

          {/* Tab Selector */}
          <div className="bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl flex gap-1 border border-zinc-200 dark:border-zinc-800">
            {['total', 'bench', 'squat', 'deadlift'].map((field) => (
              <button
                key={field}
                onClick={() => setLeaderboardSortField(field as any)}
                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${leaderboardSortField === field
                  ? `${accentBgClass} text-white dark:text-black shadow-lg`
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
              >
                {field}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {sortedData.map((entry, idx) => (
              <div key={entry.username} className="glass-panel p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-xl ${idx === 0 ? 'bg-amber-400 text-black' : idx === 1 ? 'bg-zinc-300 text-black' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm truncate max-w-[120px]">{entry.username}</h4>
                      <div className="flex gap-2 items-center mt-1">
                        <span className={`text-[9px] font-black uppercase italic ${accentColorClass}`}>
                          {leaderboardSortField.toUpperCase()}: {entry[leaderboardSortField]} KG
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-1.5">
                      {['bench', 'squat', 'deadlift', 'total'].filter(f => f !== leaderboardSortField).map(f => (
                        <div key={f} className="text-center bg-zinc-50 dark:bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                          <span className="text-[6px] font-black uppercase text-zinc-400 block">{f}</span>
                          <span className="text-[8px] font-black italic text-zinc-600 dark:text-zinc-300">{entry[f as keyof LeaderboardEntry]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Background progress indicator based on current sort field */}
                <div
                  className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 opacity-20 ${accentBgClass}`}
                  style={{ width: `${(entry[leaderboardSortField] / (sortedData[0]?.[leaderboardSortField] || 1)) * 100}%` }}
                />
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="py-20 text-center">
                <div className="text-4xl mb-4">📡</div>
                <h3 className="font-black uppercase italic text-zinc-400">Scanning Satellite...</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">No active PR signatures detected.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!token) {
    return <AuthScreen onLogin={handleLogin} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="flex h-screen max-w-md mx-auto bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden transition-colors duration-300 relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-[70] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-12">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden`}>
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="text-zinc-400 text-2xl">×</button>
          </div>
          <div className="flex-1 space-y-8">
            <nav className="space-y-2">
              <SideButton active={currentView === 'HOME'} onClick={() => navigateTo('HOME')} icon={<HomeIcon />} label="Dashboard" />
              <SideButton active={currentView === 'LEADERBOARD'} onClick={() => navigateTo('LEADERBOARD')} icon={<LeaderboardIcon />} label="Leaderboard" />
              <SideButton active={currentView === 'PLAN_EDITOR'} onClick={() => navigateTo('PLAN_EDITOR')} icon={<PlanIcon />} label="Routine" />
              <SideButton active={currentView === 'STATS'} onClick={() => navigateTo('STATS')} icon={<StatsIcon />} label="Signal" />
              <SideButton active={currentView === 'HISTORY'} onClick={() => navigateTo('HISTORY')} icon={<HistoryIcon />} label="Archive" />
            </nav>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-2">Operational Mode</h3>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 rounded-3xl border border-red-500/20 bg-red-500/5 text-red-500 active:scale-95 transition-all mb-4"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Session Logout</span>
                </div>
              </button>
              <button onClick={toggleLoadOut} className={`w-full flex items-center justify-between p-4 rounded-3xl border transition-all active:scale-95 ${isLoadOutMode ? 'border-amber-500 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 bg-white dark:bg-zinc-800'}`}>
                <div className="flex items-center gap-3">
                  <LoadOutIcon />
                  <span className="text-[10px] font-black uppercase tracking-widest">Load Out Week</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isLoadOutMode ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${isLoadOutMode ? 'left-5' : 'left-1'}`} />
                </div>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest px-2">Display Core</h3>
              <button onClick={toggleTheme} className="w-full flex items-center justify-between p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-500 active:scale-95 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{isDark ? "Light Interface" : "Dark Interface"}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
        {currentView === 'HOME' && renderHome()}
        {currentView === 'PLAN_EDITOR' && renderPlanEditor()}
        {currentView === 'STATS' && renderStats()}
        {currentView === 'HISTORY' && renderHistory()}
        {currentView === 'LEADERBOARD' && renderLeaderboard()}
        {currentView === 'EXERCISE_DETAIL' && renderLoggerView()}
        {currentView === 'WORKOUT' && activeWorkout && (
          <div className="p-6 pt-0 pb-32 animate-in fade-in slide-in-from-right-10 duration-500">
            <Header title={activeWorkout.title} />
            <div className="flex flex-col items-center mb-8 -mt-4">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${accentColorClass} animate-pulse`}>Focus Mode Active</span>
            </div>
            <div className="space-y-12">
              {activeWorkout.exercises.map((ex) => (
                <div key={ex.id} className="space-y-4">
                  <h3 className="text-xl font-black italic uppercase flex items-center gap-2">
                    <div className={`w-1 h-6 rounded-full ${accentBgClass}`}></div>
                    {ex.name}
                  </h3>
                  <ExerciseLogger
                    exercise={ex}
                    onUpdate={(sets) => handleSessionUpdate(ex.id, sets)}
                    initialSets={currentSessionResults[ex.id]}
                  />
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-6 glass-panel border-t z-50">
              <button onClick={finishWorkout} className={`w-full text-white dark:text-black font-black uppercase py-4 rounded-xl text-lg shadow-2xl ${isLoadOutMode ? 'bg-amber-500' : 'bg-zinc-900 dark:bg-white'}`}>Finish Workout</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const SideButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 ${active ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>
    {icon}
    <span className="text-xs font-black uppercase tracking-[0.1em]">{label}</span>
  </button>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
  </svg>
);
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const PlanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
);
const StatsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const LeaderboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const LoadOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export default App;
