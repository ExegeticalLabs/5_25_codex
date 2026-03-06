'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Settings,
  Calendar,
  ChevronLeft,
  Check,
  X,
  Activity,
  Dumbbell,
  RotateCcw,
  Volume2,
  Vibrate,
  ArrowRight,
  Sun,
  Moon,
  Zap,
  Home,
  AlertCircle,
  Edit3,
  RotateCcw as ResetIcon,
  Download,
  Upload
} from 'lucide-react';
import {
  exportBackupJSON,
  readBool,
  readJSON,
  setKeepAwake as nativeSetKeepAwake,
  triggerHaptic as nativeTriggerHaptic,
  writeBool,
  writeJSON
} from '../lib/native';

// =====================================================
// CONSTANTS & UTILITIES
// =====================================================

const DB_VERSION = 1;
const DB_STORAGE_KEY = 'myobound_db';
const AUDIO_UNLOCK_KEY = 'myobound_audioUnlocked';

const CATEGORIES = {
  UPPER: [
    { label: 'Step 1: Chest', key: 'chest', options: ['Dumbbell Flat Bench Press', 'Dumbbell Incline Bench Press', 'Dumbbell Fly', 'Barbell Bench Press', 'Incline Barbell Bench Press', 'Chest Press Machine', 'Incline Press Machine', 'Pec Deck / Machine Fly', 'Cable Crossover', 'User Choice'] },
    { label: 'Step 2: Back', key: 'back', options: ['One-Arm Dumbbell Row', 'Lat Pulldown (any grip)', 'Assisted Pull-Up (machine)', 'Seated Cable Row', 'Row Machine / Plate-Loaded Row', 'Dumbbell Row', 'Barbell Bent-Over Row', 'Straight-Arm Cable Pulldown', 'Pull-Up', 'User Choice'] },
    { label: 'Step 3: Shoulders', key: 'shoulders', options: ['Standing Dumbbell Overhead Press', 'Seated Dumbbell Overhead Press', 'Arnold Press', 'Standing Barbell Overhead Press', 'Push Press', 'Shoulder Press Machine', 'Smith Machine Overhead Press', 'Dumbbell Lateral Raise', 'Cable Lateral Raise', 'Dumbbell Rear-Delt Raise', 'Reverse Pec Deck', 'Face Pull (cable)', 'Dumbbell Front Raise', 'Upright Row (barbell or cable)', 'User Choice'] },
    { label: 'Step 4: Biceps', key: 'biceps', options: ['Dumbbell Curl', 'Alternate Dumbbell Curl', 'Incline Dumbbell Curl', 'Hammer Curl', 'Concentration Curl', 'Barbell Curl / EZ-Bar Curl', 'Preacher Curl', 'Cable Curl', 'User Choice'] },
    { label: 'Step 5: Triceps', key: 'triceps', options: ['Cable Pressdown / Triceps Pushdown', 'Overhead Triceps Extension (DB or cable)', 'Lying Triceps Extension / Skullcrusher (DB or EZ-bar)', 'Seated Triceps Press (overhead style)', 'Triceps Kickback', 'Bench Dip', 'Dip Machine (assisted dip)', 'User Choice'] }
  ],
  LOWER: [
    { label: 'Step 1: Quads', key: 'quads1', options: ['Goblet Squat', 'Dumbbell Front Squat (two DBs)', 'Dumbbell Squat (suitcase/side hold)', 'Heels-Elevated Goblet/DB Squat', 'Step-Up (DB)', 'Back Squat', 'Front Squat', 'Leg Press', 'Hack Squat', 'Smith Squat', 'Leg Extension', 'User Choice'] },
    { label: 'Step 2: Hamstrings / Hinge', key: 'hams', options: ['Dumbbell Romanian Deadlift (RDL)', 'Dumbbell Stiff-Leg Deadlift', 'Single-Leg Dumbbell RDL', 'Barbell Romanian Deadlift', 'Straight-Leg Deadlift', 'Conventional Deadlift', 'Trap-Bar Deadlift', 'Seated Leg Curl', 'Lying Leg Curl', 'Back Extension / Hip Extension Machine', 'User Choice'] },
    { label: 'Step 3: Glutes / Accessory', key: 'accessory', options: ['Hip Thrust / Weighted Glute Bridge', 'Hip Thrust / Glute Drive Machine', 'Walking Lunge (DB)', 'Reverse Lunge (DB)', 'Split Squat (DB)', 'Bulgarian Split Squat (DB)', 'Lateral Lunge (DB)', 'Reverse Lunge (barbell)', 'Split Squat (barbell)', 'Smith Split Squat / Smith Lunge', 'Single-Leg Leg Press', 'User Choice'] },
    { label: 'Step 4: Calves', key: 'calves', options: ['Standing Calf Raise (machine)', 'Seated Calf Raise (machine)', 'Standing Calf Raise (DB)', 'Single-Leg Calf Raise (DB)', 'Standing Calf Raise (barbell)', 'Bent Leg Calf Raise', 'Wall Lean Calf Raise', 'Wall Lean Calf Raise Single', 'User Choice'] },
    { label: 'Step 5: Quads (Different Var)', key: 'quads2', options: ['Goblet Squat', 'Dumbbell Front Squat (two DBs)', 'Dumbbell Squat (suitcase/side hold)', 'Heels-Elevated Goblet/DB Squat', 'Step-Up (DB)', 'Back Squat', 'Front Squat', 'Leg Press', 'Hack Squat', 'Smith Squat', 'Leg Extension', 'User Choice'] }
  ]
};

const COLORS = {
  light: { bg: '#F2F2F7', card: '#FFFFFF', primary: '#007AFF', text: '#000000', textSecondary: '#8E8E93', textMuted: '#AEAEB2', success: '#00FF87', danger: '#FF0055', zoneA: '#00FF87', zoneB: '#FFD700', zoneC: '#FF0055', border: '#E5E5EA', timerOverlay: '#000000', timerOverlayText: '#FFFFFF', seafoam: '#4FD1C5' },
  dark: { bg: '#000000', card: '#1C1C1E', primary: '#0A84FF', text: '#FFFFFF', textSecondary: '#8E8E93', textMuted: '#636366', success: '#00FF87', danger: '#FF0055', zoneA: '#00FF87', zoneB: '#FFD700', zoneC: '#FF0055', border: '#2C2C2E', timerOverlay: '#FFFFFF', timerOverlayText: '#000000', seafoam: '#38B2AC' }
};

const generateBlockSlots = () => {
  const slots = [];
  for (let week = 1; week <= 6; week++) {
    const isWeekA = week % 2 !== 0;
    if (isWeekA) slots.push({ type: 'UPPER', week, day: 1 }, { type: 'CARDIO', week, day: 2 }, { type: 'LOWER', week, day: 3 }, { type: 'CARDIO', week, day: 4 }, { type: 'UPPER', week, day: 5 }, { type: 'CARDIO', week, day: 6 }, { type: 'OFF', week, day: 7 });
    else slots.push({ type: 'LOWER', week, day: 1 }, { type: 'CARDIO', week, day: 2 }, { type: 'UPPER', week, day: 3 }, { type: 'CARDIO', week, day: 4 }, { type: 'LOWER', week, day: 5 }, { type: 'CARDIO', week, day: 6 }, { type: 'OFF', week, day: 7 });
  }
  return slots;
};

const slugify = (s = '') => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const createDefaultState = () => ({
  dbVersion: DB_VERSION,
  onboarded: false,
  officialStarted: false,
  currentBlock: 1,
  currentSlotIndex: 0,
  plan: { upper: [], lower: [] },
  usedInLastBlock: [],
  slots: generateBlockSlots(),
  history: [],
  settings: {
    theme: 'dark',
    haptics: true,
    beeps: true,
    metronome: false,
    audioUnlocked: false
  }
});

const mergeLoadedState = (parsed, audioUnlockedFlag = false) => {
  const base = createDefaultState();

  if (!parsed || typeof parsed !== 'object') {
    return {
      ...base,
      settings: {
        ...base.settings,
        audioUnlocked: Boolean(audioUnlockedFlag)
      }
    };
  }

  return {
    ...base,
    ...parsed,
    dbVersion: DB_VERSION,
    plan: { ...base.plan, ...(parsed.plan || {}) },
    settings: {
      ...base.settings,
      ...(parsed.settings || {}),
      audioUnlocked: Boolean((parsed.settings || {}).audioUnlocked || audioUnlockedFlag)
    },
    slots: Array.isArray(parsed.slots) && parsed.slots.length ? parsed.slots : base.slots,
    history: Array.isArray(parsed.history) ? parsed.history : base.history
  };
};

const getAdviceForExercise = (pastLogs) => {
  if (!pastLogs?.length) return { text: 'CALIBRATION' };
  const logs = [...pastLogs].reverse();
  const firstLimitIdx = logs.findIndex((l) => l.status === 'limit');
  if (firstLimitIdx !== -1) {
    const limitCycle = firstLimitIdx + 1;
    if (limitCycle <= 3) return { text: 'DROP LOAD' };
    return { text: 'KEEP LOAD' };
  }
  return { text: 'INCREASE LOAD' };
};

// =====================================================
// AUDIO ENGINE (Queue + PWA Support)
// =====================================================

const getAudioCtx = () => {
  if (typeof window === 'undefined') return null;
  if (!window.__myoboundAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) window.__myoboundAudioCtx = new Ctx();
  }
  return window.__myoboundAudioCtx;
};

const safeResumeAudio = async () => {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // no-op
    }
  }
};

let audioQueue = Promise.resolve();
const enqueueAudio = (fn) => {
  audioQueue = audioQueue.then(fn).catch(() => {});
  return audioQueue;
};

const playBeep = async (freq = 900, vol = 0.05, duration = 0.1) => {
  return enqueueAudio(async () => {
    const ctx = getAudioCtx();
    if (!ctx) return false;
    await safeResumeAudio();
    if (ctx.state !== 'running') return false;

    return new Promise((resolve) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration + 0.05);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          // no-op
        }
        resolve(true);
      };
    });
  });
};

const playCountdownTriple = async () => {
  await playBeep(950, 0.06, 0.08);
  await new Promise((r) => setTimeout(r, 220));
  await playBeep(950, 0.06, 0.08);
  await new Promise((r) => setTimeout(r, 220));
  await playBeep(950, 0.06, 0.08);
};

const playTransitionThud = async () => {
  await playBeep(350, 0.1, 0.4);
};

const unlockAudio = async () => {
  const ctx = getAudioCtx();
  if (!ctx) return false;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    await playBeep(440, 0.0001, 0.03);
    return ctx.state === 'running';
  } catch {
    return false;
  }
};

const triggerHaptic = (style = 'medium') => {
  void nativeTriggerHaptic(style);
};

// =====================================================
// WAKE LOCK
// =====================================================

function useScreenWakeLock(enabled) {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyState = async () => {
      if (!enabled) {
        await nativeSetKeepAwake(false);
        return;
      }

      const ok = await nativeSetKeepAwake(true);
      if (!cancelled) setIsSupported(ok);
    };

    void applyState();

    return () => {
      cancelled = true;
      if (enabled) void nativeSetKeepAwake(false);
    };
  }, [enabled]);

  return { isSupported };
}

// =====================================================
// SHARED UI
// =====================================================

function Card({ children, className = '', themeObj, onClick, style = {} }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : 'region'}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-[24px] p-6 shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      style={{ backgroundColor: themeObj.card, border: `1px solid ${themeObj.border}`, ...style }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = 'primary', className = '', themeObj, disabled = false, style = {}, 'aria-label': ariaLabel }) {
  const baseStyle = 'w-full py-4 rounded-[18px] font-[700] text-[16px] transition-all active:scale-[0.97] outline-none focus-visible:ring-4 focus-visible:ring-blue-500 flex items-center justify-center gap-2 tracking-tight';
  let styles = { backgroundColor: themeObj.primary, color: '#FFFFFF', opacity: disabled ? 0.5 : 1 };
  if (variant === 'secondary') styles = { backgroundColor: themeObj.bg, color: themeObj.text, border: `1px solid ${themeObj.border}`, opacity: disabled ? 0.5 : 1 };
  if (variant === 'danger') styles = { backgroundColor: themeObj.danger, color: '#FFFFFF', opacity: disabled ? 0.5 : 1 };

  return (
    <button
      aria-label={ariaLabel}
      onClick={async (e) => {
        if (disabled) return;
        await safeResumeAudio();
        onClick?.(e);
      }}
      disabled={disabled}
      className={`${baseStyle} ${className}`}
      style={{ ...styles, ...style }}
    >
      {children}
    </button>
  );
}

function TimerOverlay({ label, timeStr, themeObj }) {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 rounded-[14px] px-4 py-2 flex flex-col items-center justify-center z-30 shadow-lg pointer-events-none transition-all duration-300"
      style={{
        backgroundColor: themeObj.timerOverlay,
        color: themeObj.timerOverlayText,
        top: 'calc(max(40px, env(safe-area-inset-top) + 12px))'
      }}
    >
      <span className="text-[9px] uppercase font-bold opacity-80">{label}</span>
      <span className="text-[18px] font-black leading-none tabular-nums tracking-tighter">{timeStr}</span>
    </div>
  );
}

function BottomNav({ currentScreen, onNavigate, themeObj }) {
  const items = [
    { id: 'HUB', icon: Home, label: 'Today' },
    { id: 'HISTORY', icon: Calendar, label: 'History' },
    { id: 'SETTINGS', icon: Settings, label: 'Settings' }
  ];

  return (
    <div
      role="navigation"
      className="absolute bottom-0 left-0 right-0 flex justify-around items-center border-t z-40 bg-opacity-90 backdrop-blur-md pt-2 pb-[safe]"
      style={{
        backgroundColor: themeObj.card,
        borderColor: themeObj.border,
        minHeight: '80px'
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        return (
          <button
            key={item.id}
            aria-label={`Maps to ${item.label}`}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center justify-center w-20 h-full transition-colors active:scale-95 outline-none focus-visible:ring-2 rounded-lg"
            style={{ color: isActive ? themeObj.primary : themeObj.textMuted }}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-[700] mt-1 tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AudioGateOverlay({ visible, themeObj, onEnable, onTest, onDismiss }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: 'min(520px, 100%)', background: themeObj.card, borderRadius: 24, padding: 24, color: themeObj.text, border: `1px solid ${themeObj.border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Volume2 size={24} color={themeObj.primary} /> Enable Sound
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 24, lineHeight: 1.5, fontWeight: 500 }}>
          On iOS and Safari, timer beeps are blocked until you tap once to unlock audio. Unlock now to hear intervals in this session.
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onEnable}
            className="outline-none focus-visible:ring-4 focus-visible:ring-blue-500 transition-transform active:scale-95"
            style={{ flex: 1, padding: '14px 16px', borderRadius: 14, border: 'none', fontWeight: 900, background: themeObj.primary, color: '#fff', fontSize: 15 }}
          >
            Unlock Audio
          </button>
          <button
            onClick={onTest}
            className="outline-none focus-visible:ring-4 focus-visible:ring-blue-500 active:scale-95 transition-transform"
            style={{ padding: '14px 16px', borderRadius: 14, border: `2px solid ${themeObj.border}`, background: 'transparent', color: themeObj.text, fontWeight: 900, fontSize: 15 }}
          >
            Test Beep
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="outline-none focus-visible:ring-2 active:opacity-50 transition-opacity"
          style={{ marginTop: 16, width: '100%', padding: '12px 12px', borderRadius: 14, border: 'none', background: 'transparent', color: themeObj.textSecondary, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11 }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

function BlockedAudioChip({ beepsEnabled, audioUnlocked, themeObj, onClick }) {
  if (!beepsEnabled || audioUnlocked) return null;
  return (
    <button
      onClick={onClick}
      className="absolute right-4 z-40 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border outline-none focus-visible:ring-2 animate-pulse transition-all"
      style={{
        backgroundColor: themeObj.danger,
        borderColor: 'rgba(255,255,255,0.2)',
        color: '#FFF',
        top: 'calc(max(40px, env(safe-area-inset-top) + 12px))'
      }}
    >
      <Volume2 size={12} strokeWidth={3} />
      <span className="text-[9px] font-black uppercase tracking-widest">Sound Locked</span>
    </button>
  );
}

function WakeLockNotice({ isSupported, themeObj }) {
  if (isSupported) return null;
  return (
    <div className="flex justify-center mt-6 mb-2 opacity-40 pointer-events-none">
      <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 text-center" style={{ color: themeObj.text }}>
        <AlertCircle size={12} /> Keep app open to prevent sleep
      </span>
    </div>
  );
}

// =====================================================
// SCREENS
// =====================================================

function WelcomeScreen({ onNext, themeObj }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden" style={{ backgroundColor: themeObj.bg }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] opacity-20 pointer-events-none animate-pulse" style={{ backgroundColor: themeObj.primary }} />
      <div className="z-10 flex flex-col items-center max-w-sm">
        <div className="w-28 h-28 rounded-[36px] flex items-center justify-center mb-10 shadow-2xl scale-110" style={{ backgroundColor: themeObj.primary }}>
          <Zap size={56} color="#FFF" strokeWidth={2.5} />
        </div>
        <h1 className="text-[52px] font-[1000] mb-4 tracking-tighter leading-none" style={{ color: themeObj.text }}>MyoBound</h1>
        <p className="text-xl mb-12 font-bold leading-relaxed opacity-60 px-4" style={{ color: themeObj.text }}>
          Systematic Adaptation.<br />Precision Training.
        </p>
        <Button onClick={onNext} themeObj={themeObj} className="shadow-2xl py-6 text-lg tracking-[0.2em] uppercase font-black">
          Engage Protocol <ArrowRight size={22} strokeWidth={3} />
        </Button>
      </div>
    </div>
  );
}

function SetupWizard({ db, setDb, onComplete, themeObj }) {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({ upper: [], lower: [] });
  const [isEnteringCustom, setIsEnteringCustom] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');

  const currentCategory = step < 5 ? CATEGORIES.UPPER[step] : CATEGORIES.LOWER[step - 5];

  const handleFinalizeChoice = (name) => {
    const lane = step < 5 ? 'upper' : 'lower';
    const category = step < 5 ? CATEGORIES.UPPER[step] : CATEGORIES.LOWER[step - 5];
    const isCustom = category.options.indexOf(name) === -1 || name === 'User Choice';

    const exercise = {
      id: isCustom ? `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}` : `${lane}_${category.key}_${slugify(name)}`,
      name,
      sets: 5,
      reps: '10'
    };

    const newSelections = { ...selections, [lane]: [...selections[lane]] };
    if (step < 5) newSelections.upper[step] = exercise;
    else newSelections.lower[step - 5] = exercise;

    setSelections(newSelections);
    setIsEnteringCustom(false);
    setCustomExerciseName('');

    if (step < 9) {
      setStep((s) => s + 1);
      return;
    }

    setDb((prev) => ({
      ...prev,
      plan: newSelections,
      onboarded: true,
      officialStarted: true
    }));
    onComplete();
  };

  if (isEnteringCustom) {
    return (
      <div className="flex-1 flex flex-col p-6 overflow-hidden" style={{ backgroundColor: themeObj.bg }}>
        <div className="pt-[safe-md] mb-8">
          <h1 className="text-[32px] font-black tracking-tighter leading-tight" style={{ color: themeObj.text }}>User Choice</h1>
          <p className="text-md mt-2 font-medium opacity-60" style={{ color: themeObj.text }}>Define variation for {currentCategory.label.split(': ')[1]}</p>
        </div>
        <div className="flex-1 flex flex-col gap-6">
          <input
            type="text"
            autoFocus
            value={customExerciseName}
            onChange={(e) => setCustomExerciseName(e.target.value.replace(/[^a-zA-Z0-9 -]/g, ''))}
            placeholder="Exercise Name..."
            className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 text-xl font-bold outline-none transition-all"
            style={{ color: themeObj.text }}
          />
          <Button disabled={customExerciseName.trim().length < 2} onClick={() => handleFinalizeChoice(customExerciseName.trim())} themeObj={themeObj}>
            Lock in Variation <ArrowRight size={20} strokeWidth={2.5} />
          </Button>
          <button onClick={() => setIsEnteringCustom(false)} className="text-sm font-bold opacity-40 uppercase tracking-widest mt-4 outline-none focus-visible:ring-2 rounded-lg p-2" style={{ color: themeObj.text }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden" style={{ backgroundColor: themeObj.bg }}>
      <div className="pt-[safe-md] mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: themeObj.primary }}>Step {step + 1} of 10</span>
          <span className="text-[11px] font-black uppercase tracking-widest opacity-40" style={{ color: themeObj.text }}>{step < 5 ? 'Upper' : 'Lower'}</span>
        </div>
        <h1 className="text-[28px] font-[900] tracking-tighter leading-tight" style={{ color: themeObj.text }}>{currentCategory.label}</h1>
        <p className="text-sm mt-2 font-medium opacity-60" style={{ color: themeObj.text }}>Select your variation for this block.</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pb-8">
        {currentCategory.options.map((opt) => {
          const isPreviouslyUsed = db.usedInLastBlock?.includes(opt);
          return (
            <button
              key={opt}
              disabled={isPreviouslyUsed}
              onClick={() => {
                if (opt === 'User Choice') setIsEnteringCustom(true);
                else handleFinalizeChoice(opt);
              }}
              className={`w-full text-left p-5 rounded-[20px] font-bold text-[16px] transition-all border-2 outline-none focus-visible:ring-4 focus-visible:ring-blue-500 ${isPreviouslyUsed ? 'opacity-20' : 'active:scale-95'}`}
              style={{ backgroundColor: themeObj.card, borderColor: themeObj.border, color: themeObj.text }}
            >
              <div className="flex justify-between items-center gap-2">
                <span>{opt}</span>
                {isPreviouslyUsed && <span className="text-[9px] uppercase font-black tracking-widest opacity-60">Last Used</span>}
                {opt === 'User Choice' && <Edit3 size={18} className="opacity-40 shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 min-h-[44px]">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="text-sm font-bold flex items-center gap-1 opacity-60 outline-none focus-visible:ring-2 rounded-lg p-2" style={{ color: themeObj.text }}>
            <ChevronLeft size={16} /> Back
          </button>
        )}
      </div>
    </div>
  );
}

function HubScreen({ db, setDb, onNavigate, themeObj }) {
  const currentSlot = db.slots[db.currentSlotIndex] ?? { type: 'UPPER', week: 1, day: 1 };
  const toggleTheme = () => setDb((prev) => ({ ...prev, settings: { ...prev.settings, theme: prev.settings.theme === 'dark' ? 'light' : 'dark' } }));
  const getSlotIcon = (type) => {
    if (type === 'UPPER' || type === 'LOWER') return <Dumbbell size={28} />;
    if (type === 'CARDIO') return <Activity size={28} />;
    return <Zap size={28} />;
  };

  const officialProgressPct = Math.max(0, Math.min(100, Math.round((db.currentSlotIndex / 42) * 100)));

  return (
    <div className="flex-1 flex flex-col relative h-full">
      <div className="px-6 pt-[safe-md] pb-4 flex justify-between items-center bg-opacity-95 backdrop-blur-md sticky top-0 z-50" style={{ backgroundColor: themeObj.bg }}>
        <div>
          <h1 className="text-[34px] font-[1000] tracking-tighter" style={{ color: themeObj.text }}>Today</h1>
          <p className="text-[14px] font-bold uppercase opacity-50 tracking-widest" style={{ color: themeObj.textSecondary }}>
            {db.officialStarted ? `Block ${db.currentBlock} • Wk ${currentSlot.week}` : 'Practice Mode'}
          </p>
        </div>
        <button onClick={toggleTheme} className="p-3 rounded-full border-2 transition-transform active:scale-90 outline-none focus-visible:ring-4 focus-visible:ring-blue-500" style={{ backgroundColor: themeObj.card, borderColor: themeObj.border }} aria-label="Toggle theme">
          {db.settings.theme === 'dark' ? <Sun size={20} color={themeObj.text} /> : <Moon size={20} color={themeObj.text} />}
        </button>
      </div>

      <div className="flex-1 px-6 mt-4 overflow-y-auto pb-[calc(12rem+env(safe-area-inset-bottom))]">
        {db.officialStarted && (
          <Card
            themeObj={themeObj}
            className="mb-8 relative overflow-hidden shadow-xl border-0"
            onClick={() => onNavigate(currentSlot.type === 'OFF' ? 'OFF' : currentSlot.type === 'CARDIO' ? 'CARDIO' : 'STRENGTH')}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(135deg, ${themeObj.primary}, transparent)` }} />
            <div className="absolute top-6 right-6 opacity-20" style={{ color: themeObj.primary }}>{getSlotIcon(currentSlot.type)}</div>
            <h2 className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: themeObj.primary }}>Current Protocol</h2>
            <h3 className="text-[28px] font-black mb-4 tracking-tighter" style={{ color: themeObj.text }}>
              {currentSlot.type === 'OFF' ? 'Recovery Day' : `${currentSlot.type} Session`}
            </h3>
            <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: themeObj.bg }}>
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${officialProgressPct}%`, backgroundColor: themeObj.primary }} />
            </div>
            <p className="text-[11px] font-black uppercase opacity-40" style={{ color: themeObj.text }}>Tap to engage engine</p>
          </Card>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-[900] tracking-tight mb-4 opacity-80" style={{ color: themeObj.text }}>Quick Start</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card themeObj={themeObj} className="flex flex-col items-center justify-center p-6 text-center border-0 shadow-md" onClick={() => onNavigate('STRENGTH_UPPER')}>
              <Dumbbell size={32} className="mb-3" color={themeObj.primary} />
              <span className="font-black text-[12px] uppercase tracking-widest" style={{ color: themeObj.text }}>Upper Body</span>
            </Card>
            <Card themeObj={themeObj} className="flex flex-col items-center justify-center p-6 text-center border-0 shadow-md" onClick={() => onNavigate('STRENGTH_LOWER')}>
              <Dumbbell size={32} className="mb-3" color={themeObj.primary} />
              <span className="font-black text-[12px] uppercase tracking-widest" style={{ color: themeObj.text }}>Lower Body</span>
            </Card>
            <Card themeObj={themeObj} className="flex flex-col items-center justify-center p-6 text-center border-0 shadow-md" onClick={() => onNavigate('MANUAL_CARDIO')}>
              <Activity size={32} className="mb-3" color={themeObj.zoneB} />
              <span className="font-black text-[12px] uppercase tracking-widest" style={{ color: themeObj.text }}>Cardio</span>
            </Card>
            <Card themeObj={themeObj} className="flex flex-col items-center justify-center p-6 text-center border-0 shadow-md" onClick={() => onNavigate('MANUAL_CORE')}>
              <Zap size={32} className="mb-3" color={themeObj.primary} />
              <span className="font-black text-[12px] uppercase tracking-widest" style={{ color: themeObj.text }}>Stability</span>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// WORKOUT SESSION COMPONENTS
// =====================================================

function SwipeableExerciseRow({
  exercise,
  weight,
  onWeightChange,
  exerciseCompletedSets,
  currentLogs,
  pastHistoryLogs,
  onCompleteSet,
  onUndoSet,
  hapticsEnabled,
  themeObj,
  currentCycleFloor,
  isCurrentExercise
}) {
  const [dragX, setDragX] = useState(0);
  const [startX, setStartX] = useState(null);
  const [startY, setStartY] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [limitPromptActive, setLimitPromptActive] = useState(false);

  const SWIPE_THRESHOLD = 90;
  const completedCount = exerciseCompletedSets || 0;
  const isCompleteForThisCycle = completedCount > currentCycleFloor;

  const hasLimitReached = useMemo(() => (currentLogs || []).some((l) => l.status === 'limit'), [currentLogs]);
  const advice = useMemo(() => {
    const a = getAdviceForExercise(pastHistoryLogs);
    const color = a.text === 'DROP LOAD' ? themeObj.danger : a.text === 'KEEP LOAD' ? themeObj.primary : a.text === 'INCREASE LOAD' ? themeObj.success : themeObj.textMuted;
    return { ...a, style: { color } };
  }, [pastHistoryLogs, themeObj]);

  const handleStart = (x, y) => {
    if (isCompleteForThisCycle || limitPromptActive) return;
    setStartX(x);
    setStartY(y);
    setIsSwiping(false);
  };

  const handleMove = (x, y) => {
    if (startX === null || startY === null || isCompleteForThisCycle || limitPromptActive) return;
    const diffX = x - startX;
    const diffY = y - startY;

    if (!isSwiping) {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
        setStartX(null);
        setStartY(null);
        return;
      }
      if (Math.abs(diffX) > 10) {
        setIsSwiping(true);
      }
    }

    if (isSwiping) {
      setDragX(diffX * 0.9);
    }
  };

  const handleEnd = () => {
    if (startX === null) return;
    if (dragX > SWIPE_THRESHOLD) {
      if (hapticsEnabled) triggerHaptic('heavy');
      onCompleteSet({ status: 'success', reps: 10, weight });
    } else if (dragX < -SWIPE_THRESHOLD) {
      if (hapticsEnabled) triggerHaptic('heavy');
      setLimitPromptActive(true);
    }
    setDragX(0);
    setStartX(null);
    setStartY(null);
    setIsSwiping(false);
  };

  if (limitPromptActive) {
    return (
      <Card themeObj={themeObj} className="mb-4 border-2 p-5 flex flex-col items-center shadow-lg" style={{ borderColor: themeObj.danger }}>
        <div className="text-[12px] font-black uppercase tracking-widest mb-4" style={{ color: themeObj.text }}>Select Limit Reps</div>
        <div className="flex gap-2 flex-wrap justify-center">
          {[5, 6, 7, 8, 9].map((num) => (
            <button key={num} onClick={() => { onCompleteSet({ status: 'limit', reps: num, weight }); setLimitPromptActive(false); }} className="w-14 h-14 rounded-full font-black text-white shadow-md active:scale-110" style={{ backgroundColor: themeObj.danger }}>{num}</button>
          ))}
          <button aria-label="Cancel limit reps" onClick={() => setLimitPromptActive(false)} className="w-14 h-14 rounded-full border-2 flex items-center justify-center ml-2 opacity-50 outline-none focus-visible:ring-2" style={{ borderColor: themeObj.border, color: themeObj.textSecondary }}><X size={20} /></button>
        </div>
      </Card>
    );
  }

  const bgFill = isCompleteForThisCycle ? (hasLimitReached ? themeObj.danger : themeObj.success) : isCurrentExercise ? themeObj.bg : themeObj.card;
  const contrastColor = isCompleteForThisCycle ? '#FFFFFF' : themeObj.text;
  const statusLabel = hasLimitReached ? 'LIMIT' : 'APPROVED';

  return (
    <div className="relative mb-4 overflow-hidden rounded-[24px]">
      <div className="absolute inset-0 flex items-center px-8 font-black text-white" style={{ backgroundColor: dragX > 0 ? themeObj.success : themeObj.danger, justifyContent: dragX > 0 ? 'flex-start' : 'flex-end' }}>
        {dragX > 0 ? <Check size={36} strokeWidth={4} /> : <AlertCircle size={36} strokeWidth={4} />}
      </div>
      <div
        className="relative z-10 p-6 flex justify-between items-center transition-all duration-300 select-none touch-pan-y"
        style={{
          backgroundColor: bgFill,
          transform: `translateX(${dragX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.35s ease',
          border: `2px solid ${isCompleteForThisCycle ? 'transparent' : isCurrentExercise ? themeObj.primary : themeObj.border}`,
          borderRadius: '24px',
          boxShadow: isCurrentExercise && !isCompleteForThisCycle ? `0 10px 28px -16px ${themeObj.primary}` : 'none'
        }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); handleStart(e.clientX, e.clientY); }}
        onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
        onPointerUp={handleEnd}
        onPointerCancel={handleEnd}
      >
        <div className="flex-1 pointer-events-none pr-4">
          <div className="flex flex-col gap-1">
            <h4 className="font-[1000] text-[20px] tracking-tight leading-tight uppercase" style={{ color: contrastColor }}>{exercise.name}</h4>
            {isCompleteForThisCycle ? (
              <span className="text-[12px] font-black uppercase tracking-[0.2em] opacity-80" style={{ color: '#FFF' }}>{statusLabel}</span>
            ) : (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isCurrentExercise && <span className="text-[10px] font-black uppercase tracking-[0.16em] px-2 py-0.5 rounded" style={{ backgroundColor: themeObj.primary, color: '#fff' }}>CURRENT</span>}
                <span className="text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-opacity-10" style={{ backgroundColor: themeObj.primary, color: themeObj.primary }}>10 REPS</span>
                <span className="text-[10px] font-black uppercase tracking-widest" style={advice.style}>{advice.text}</span>
              </div>
            )}
            {pastHistoryLogs && pastHistoryLogs.length > 0 && !isCompleteForThisCycle && (
              <div className="text-[10px] font-bold opacity-30 mt-1" style={{ color: themeObj.text }}>PREV: {String(pastHistoryLogs[0]?.weight ?? 0)}lb ({pastHistoryLogs.map((l) => (l.status === 'success' ? '10' : String(l.reps))).join('•')})</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className="flex flex-col items-center justify-center w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] rounded-full border-[6px] relative shadow-lg transition-colors duration-300"
            style={{ borderColor: isCompleteForThisCycle ? 'rgba(255,255,255,0.4)' : themeObj.primary, backgroundColor: isCompleteForThisCycle ? 'rgba(0,0,0,0.1)' : 'transparent' }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              inputMode="numeric"
              value={weight ?? ''}
              placeholder="0"
              disabled={isCompleteForThisCycle}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, '');
                if (raw === '') {
                  onWeightChange('');
                  return;
                }
                const dots = raw.match(/\./g);
                if (dots && dots.length > 1) return;
                onWeightChange(raw);
              }}
              className="w-full max-w-[90%] text-center font-[1000] text-[22px] sm:text-[26px] bg-transparent outline-none focus:ring-0"
              style={{ color: contrastColor }}
            />
            <span className="text-[10px] font-black uppercase tracking-widest absolute bottom-2 opacity-60 pointer-events-none" style={{ color: contrastColor }}>LB</span>
          </div>

          <button
            onClick={() => {
              if (completedCount > 0) {
                if (hapticsEnabled) triggerHaptic('light');
                onUndoSet();
              }
            }}
            aria-label="Undo set"
            disabled={completedCount === 0}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`flex flex-col items-center justify-center min-w-[50px] transition-transform outline-none rounded-xl p-2 bg-black bg-opacity-0 hover:bg-opacity-5 ${completedCount > 0 ? 'active:scale-90 cursor-pointer' : 'opacity-40 cursor-default'}`}
          >
            <span className="text-[28px] font-[1000] leading-none" style={{ color: contrastColor }}>{completedCount}</span>
            <span className="text-[11px] font-black opacity-60 uppercase flex items-center justify-center gap-1 mt-1" style={{ color: contrastColor }}>
              / 5 {completedCount > 0 && <ResetIcon size={12} className="opacity-70" />}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RestFlipDigits({ value, label, isUrgent, themeObj, large = false }) {
  const chars = useMemo(() => String(value).split(''), [value]);
  const [changedFlags, setChangedFlags] = useState(() => chars.map(() => false));
  const prevCharsRef = useRef(chars);

  useEffect(() => {
    const prev = prevCharsRef.current;
    const next = chars;
    const nextFlags = next.map((char, idx) => prev[idx] !== char);
    prevCharsRef.current = next;

    if (!nextFlags.some(Boolean)) {
      setChangedFlags(next.map(() => false));
      return;
    }

    setChangedFlags(nextFlags);
    const t = setTimeout(() => setChangedFlags(next.map(() => false)), 280);
    return () => clearTimeout(t);
  }, [chars]);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative overflow-hidden border flex items-center justify-center bg-black ${large ? 'w-[140px] sm:w-[174px] h-[160px] sm:h-[198px] rounded-[22px]' : 'w-[120px] sm:w-[150px] h-[140px] sm:h-[170px] rounded-[18px]'}`}
        style={{ borderColor: isUrgent ? 'rgba(255,209,102,0.6)' : 'rgba(255,255,255,0.16)' }}
      >
        <span className={`flex items-center justify-center leading-none tabular-nums ${large ? 'gap-[3px] sm:gap-[4px]' : 'gap-[2px] sm:gap-[3px]'}`}>
          {chars.map((char, idx) => (
            <span
              key={idx}
              className={`rest-flip-digit ${changedFlags[idx] ? 'rest-flip-digit--animate' : ''} inline-block text-center min-w-[0.56ch] font-black leading-none ${large ? 'text-[92px] sm:text-[124px]' : 'text-[80px] sm:text-[106px]'}`}
              style={{ color: isUrgent ? '#FFD166' : '#F8FAFC' }}
            >
              {char}
            </span>
          ))}
        </span>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 h-px rounded-full"
          style={{
            backgroundColor: 'rgba(2,3,4,0.72)',
            boxShadow: isUrgent
              ? '0 -1px 0 rgba(255,209,102,0.30), 0 1px 0 rgba(255,209,102,0.10)'
              : '0 -1px 0 rgba(255,255,255,0.24), 0 1px 0 rgba(255,255,255,0.08)'
          }}
        />
      </div>
      <span className={`font-black uppercase ${large ? 'mt-3 text-[11px] tracking-[0.22em]' : 'mt-2 text-[10px] tracking-[0.24em]'}`} style={{ color: isUrgent ? '#FFD166' : 'rgba(255,255,255,0.55)' }}>{label}</span>
    </div>
  );
}

function StrengthWorkout({ db, setDb, onComplete, onCancel, workoutTypeOverride, themeObj }) {
  const currentSlotType = workoutTypeOverride || db.slots[db.currentSlotIndex]?.type || 'UPPER';
  const exercises = db.plan[currentSlotType.toLowerCase()] || [];
  const isManualSession = Boolean(workoutTypeOverride);

  const [elapsed, setElapsed] = useState(0);
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [weights, setWeights] = useState({});
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(120);

  const { isSupported: wakeLockSupported } = useScreenWakeLock(true);

  const beepsEnabled = Boolean(db.settings?.beeps);
  const audioUnlocked = Boolean(db.settings?.audioUnlocked);
  const [dismissedAudioGate, setDismissedAudioGate] = useState(false);
  const showAudioGate = beepsEnabled && !audioUnlocked && !dismissedAudioGate;

  const emitThud = async () => { if (beepsEnabled && audioUnlocked) await playTransitionThud(); };
  const emitHaptic = (style = 'medium') => { if (db.settings?.haptics) triggerHaptic(style); };

  const pastWorkout = useMemo(() => db.history.find((h) => h.data?.kind === 'STRENGTH' && h.data?.slotType === currentSlotType), [db.history, currentSlotType]);

  useEffect(() => {
    const int = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => clearInterval(int);
  }, []);

  const currentCycleFloor = useMemo(() => {
    if (exercises.length === 0) return 0;
    return Math.min(...exercises.map((ex) => workoutLogs[ex.id]?.length || 0));
  }, [exercises, workoutLogs]);

  const currentCycle = Math.min(currentCycleFloor + 1, 5);
  const currentExerciseId = useMemo(() => {
    const first = exercises.find((ex) => (workoutLogs[ex.id]?.length || 0) === currentCycleFloor);
    return first?.id || null;
  }, [exercises, workoutLogs, currentCycleFloor]);
  const currentExerciseName = exercises.find((ex) => ex.id === currentExerciseId)?.name;

  const prevCycleRef = useRef(0);
  useEffect(() => {
    const prev = prevCycleRef.current;
    if (currentCycleFloor > prev && currentCycleFloor < 5) {
      setIsResting(true);
      setRestTime(120);
      emitHaptic('heavy');
      void emitThud();
    }
    prevCycleRef.current = currentCycleFloor;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCycleFloor]);

  useEffect(() => {
    let int;
    if (isResting && restTime > 0) {
      int = setInterval(() => {
        setRestTime((p) => {
          if (p <= 10 && p > 0 && db.settings?.haptics) emitHaptic('light');
          if (p <= 3 && p > 0 && beepsEnabled && audioUnlocked) void playBeep(980, 0.05, 0.06);
          if (p <= 1) {
            setIsResting(false);
            void emitThud();
            emitHaptic('heavy');
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResting, restTime, beepsEnabled, audioUnlocked, db.settings?.haptics]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const allExercisesComplete = exercises.length > 0 && exercises.every((ex) => (workoutLogs[ex.id]?.length || 0) === 5);
  const canFinalize = isManualSession ? Object.values(workoutLogs).flat().length > 0 : allExercisesComplete;

  const restMinutes = String(Math.floor(restTime / 60));
  const restSeconds = String(restTime % 60).padStart(2, '0');
  const restUrgent = restTime <= 15;
  const restHint = currentCycleFloor <= 1
    ? `Cycle ${currentCycleFloor} complete • Up next: Cycle ${Math.min(currentCycleFloor + 1, 5)}`
    : currentCycleFloor <= 3
      ? 'Fail 2–3 = drop load'
      : 'Fail 4–5 = keep load';
  const skipRestNow = () => {
    setRestTime(0);
    setIsResting(false);
    emitHaptic('medium');
    void emitThud();
  };

  const handleAudioUnlock = async () => {
    const ok = await unlockAudio();
    if (ok) {
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, audioUnlocked: true } }));
      setDismissedAudioGate(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: themeObj.bg }}>
      <AudioGateOverlay
        visible={showAudioGate}
        themeObj={themeObj}
        onEnable={handleAudioUnlock}
        onTest={async () => {
          const ok = await playBeep(740, 0.12, 0.08);
          if (ok) {
            setDb((prev) => ({ ...prev, settings: { ...prev.settings, audioUnlocked: true } }));
            setDismissedAudioGate(true);
          }
        }}
        onDismiss={() => setDismissedAudioGate(true)}
      />
      <BlockedAudioChip beepsEnabled={beepsEnabled} audioUnlocked={audioUnlocked} themeObj={themeObj} onClick={() => setDismissedAudioGate(false)} />

      {isResting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#050507' }}>
          <span className="text-[11px] font-black uppercase tracking-[0.26em] mb-3" style={{ color: restUrgent ? '#FFD166' : 'rgba(255,255,255,0.55)' }}>
            REST
          </span>
          <div className="flex items-center gap-3 sm:gap-5">
            <RestFlipDigits value={restMinutes} label="MIN" isUrgent={restUrgent} themeObj={themeObj} />
            <span className="text-[64px] font-black pb-6" style={{ color: restUrgent ? '#FFD166' : '#F8FAFC' }}>:</span>
            <RestFlipDigits value={restSeconds} label="SEC" isUrgent={restUrgent} themeObj={themeObj} />
          </div>
          <p className="mt-8 text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.68)' }}>{restHint}</p>
          <button
            onClick={skipRestNow}
            className="mt-7 px-8 py-3 rounded-full border text-[12px] font-black uppercase tracking-[0.2em] active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ borderColor: 'rgba(255,255,255,0.45)', color: 'rgba(255,255,255,0.95)', backgroundColor: 'rgba(255,255,255,0.06)' }}
            aria-label="Skip rest timer"
          >
            Skip Rest
          </button>
        </div>
      )}

      <div className="px-6 pt-[safe-lg] pb-5 z-40 relative shadow-sm" style={{ backgroundColor: themeObj.card }}>
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <span className="text-[11px] font-black uppercase tracking-[0.22em]" style={{ color: themeObj.primary }}>Sequence Console</span>
            <h1 className="text-[30px] font-black tracking-tighter uppercase leading-tight" style={{ color: themeObj.text }}>{currentSlotType} Session</h1>
            <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-70" style={{ color: themeObj.textSecondary }}>Cycle {currentCycle} of 5{currentExerciseName ? ` • ${currentExerciseName}` : ''}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right mt-1">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: themeObj.text }}>Session Clock</span>
              <div className="text-[16px] font-black tabular-nums" style={{ color: themeObj.text }}>{formatTime(elapsed)}</div>
            </div>
            <button onClick={onCancel} className="p-2 outline-none focus-visible:ring-2 rounded-full" style={{ color: themeObj.text }} aria-label="Exit workout"><X size={26} /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {exercises.length === 0 ? (
          <Card themeObj={themeObj} className="border-0 shadow-md">
            <h3 className="text-xl font-black tracking-tight mb-2" style={{ color: themeObj.text }}>No {currentSlotType.toLowerCase()} plan selected yet</h3>
            <p className="text-sm opacity-60" style={{ color: themeObj.text }}>Return to the hub and complete setup.</p>
          </Card>
        ) : (
          <>
            {exercises.map((ex) => (
              <SwipeableExerciseRow
                key={ex.id}
                exercise={ex}
                currentCycleFloor={currentCycleFloor}
                isCurrentExercise={ex.id === currentExerciseId}
                weight={weights[ex.id] ?? ''}
                onWeightChange={(v) => setWeights((prev) => ({ ...prev, [ex.id]: v }))}
                exerciseCompletedSets={workoutLogs[ex.id]?.length || 0}
                currentLogs={workoutLogs[ex.id] || []}
                pastHistoryLogs={pastWorkout?.data?.workoutLogs?.[ex.id]}
                onCompleteSet={(logEntry) => {
                  setWorkoutLogs((prev) => ({ ...prev, [ex.id]: [...(prev[ex.id] || []), logEntry] }));
                  if (beepsEnabled && audioUnlocked) void playBeep(860, 0.04, 0.08);
                }}
                onUndoSet={() => {
                  setWorkoutLogs((prev) => {
                    const arr = [...(prev[ex.id] || [])];
                    arr.pop();
                    return { ...prev, [ex.id]: arr };
                  });
                }}
                hapticsEnabled={Boolean(db.settings?.haptics)}
                themeObj={themeObj}
              />
            ))}
            <WakeLockNotice isSupported={wakeLockSupported} themeObj={themeObj} />
            <div className="h-32" />
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 pb-[safe-lg] z-30 bg-opacity-95 backdrop-blur-lg border-t" style={{ backgroundColor: themeObj.card, borderColor: themeObj.border }}>
        <Button
          onClick={() => onComplete({ kind: 'STRENGTH', slotType: currentSlotType, elapsed, workoutLogs, totalSets: exercises.length * 5, completedSets: Object.values(workoutLogs).flat().length })}
          themeObj={themeObj}
          disabled={!canFinalize}
          className="py-5 shadow-lg uppercase tracking-widest"
        >
          {isManualSession || allExercisesComplete ? 'Finalize Workout' : 'Complete Cycle'}
        </Button>
        {!allExercisesComplete && !isManualSession && (
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-center mt-3 opacity-45" style={{ color: themeObj.text }}>Complete all 5 exercises to trigger strict 2:00 rest.</p>
        )}
      </div>
    </div>
  );
}

function CardioWorkout({ db, setDb, onComplete, onCancel, themeObj }) {
  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [equipment, setEquipment] = useState('Treadmill');
  const [isEnteringCustomEq, setIsEnteringCustomEq] = useState(false);
  const [customEquipment, setCustomEquipment] = useState('');
  const [metrics, setMetrics] = useState({ zoneA: '', zoneB: '', zoneC: '' });
  const [phasePulse, setPhasePulse] = useState(false);

  const { isSupported: wakeLockSupported } = useScreenWakeLock(true);

  const beepsEnabled = Boolean(db.settings?.beeps);
  const audioUnlocked = Boolean(db.settings?.audioUnlocked);
  const [dismissedAudioGate, setDismissedAudioGate] = useState(false);
  const showAudioGate = beepsEnabled && !audioUnlocked && !dismissedAudioGate;

  const emitThud = async () => { if (beepsEnabled && audioUnlocked) await playTransitionThud(); };
  const emitHaptic = (style = 'medium') => { if (db.settings?.haptics) triggerHaptic(style); };

  const lastCardio = useMemo(() => db.history.find((h) => h.data?.cardio), [db.history]);
  const lastTarget = lastCardio?.data?.cardio?.metrics;

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const timeInRound = elapsed % 300;
  const currentRound = Math.min(5, Math.floor(elapsed / 300) + 1);

  const zone = timeInRound < 120 ? 'A' : timeInRound < 240 ? 'B' : 'C';
  const currentZoneName = `Zone ${zone}`;
  const zoneDuration = zone === 'C' ? 60 : 120;
  const zoneElapsed = zone === 'A' ? timeInRound : zone === 'B' ? timeInRound - 120 : timeInRound - 240;
  const zoneTimeLeft = zoneDuration - zoneElapsed;
  const cardioMinutes = String(Math.floor(zoneTimeLeft / 60));
  const cardioSeconds = String(zoneTimeLeft % 60).padStart(2, '0');
  const zoneProgressPct = Math.max(0, Math.min(100, (zoneElapsed / zoneDuration) * 100));
  const zoneColor = zone === 'A' ? themeObj.zoneA : zone === 'B' ? themeObj.zoneB : themeObj.zoneC;
  const nextZone = zone === 'A' ? 'Zone B' : zone === 'B' ? 'Zone C' : currentRound === 5 ? 'Complete' : 'Zone A';
  const isFinalCountdown = zoneTimeLeft <= 10 && zoneTimeLeft > 0;

  const phaseKey = `${currentRound}-${zone}`;
  const prevPhaseRef = useRef(phaseKey);
  useEffect(() => {
    if (prevPhaseRef.current !== phaseKey) {
      setPhasePulse(true);
      const t = setTimeout(() => setPhasePulse(false), 220);
      prevPhaseRef.current = phaseKey;
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phaseKey]);

  useEffect(() => {
    let int;
    if (isActive) {
      int = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          const nextTimeInRound = next % 300;
          const nextZoneLeft = nextTimeInRound < 120 ? 120 - nextTimeInRound : nextTimeInRound < 240 ? 240 - nextTimeInRound : 300 - nextTimeInRound;

          if (nextZoneLeft <= 10 && nextZoneLeft > 0 && db.settings?.haptics) emitHaptic('light');
          if (nextZoneLeft <= 3 && nextZoneLeft > 0 && beepsEnabled && audioUnlocked) void playBeep(1040, 0.05, 0.06);
          if (nextZoneLeft === 0) {
            void emitThud();
            emitHaptic('heavy');
          }

          if (next >= 1500) {
            emitHaptic('heavy');
            void emitThud();
            setIsActive(false);
            setShowSummary(true);
            return 1500;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, beepsEnabled, audioUnlocked, db.settings?.haptics]);

  const handleAudioUnlock = async () => {
    const ok = await unlockAudio();
    if (ok) {
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, audioUnlocked: true } }));
      setDismissedAudioGate(true);
    }
  };

  if (showSummary) {
    return (
      <div className="flex-1 flex flex-col p-6 pb-[safe-lg] overflow-y-auto" style={{ backgroundColor: themeObj.bg }}>
        <div className="pt-[safe-md] mb-8">
          <h1 className="text-3xl font-black tracking-tighter leading-tight uppercase" style={{ color: themeObj.text }}>Session Summary</h1>
        </div>
        <Card themeObj={themeObj} className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-50" style={{ color: themeObj.text }}>Equipment</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Treadmill', 'Bike', 'Rower', 'Elliptical', 'Stairs', 'Outside'].map((e) => (
              <button key={e} onClick={() => { setEquipment(e); setIsEnteringCustomEq(false); }} className="py-3 rounded-xl border-2 transition-all outline-none focus-visible:ring-2" style={{ backgroundColor: equipment === e && !isEnteringCustomEq ? themeObj.primary : 'transparent', borderColor: equipment === e && !isEnteringCustomEq ? themeObj.primary : themeObj.border, color: equipment === e && !isEnteringCustomEq ? '#FFF' : themeObj.textSecondary }}>{e}</button>
            ))}
            <button onClick={() => setIsEnteringCustomEq(true)} className="py-3 rounded-xl border-2 transition-all col-span-2 flex items-center justify-center gap-2 outline-none focus-visible:ring-2" style={{ backgroundColor: isEnteringCustomEq ? themeObj.primary : 'transparent', borderColor: isEnteringCustomEq ? themeObj.primary : themeObj.border, color: isEnteringCustomEq ? '#FFF' : themeObj.textSecondary }}>
              {isEnteringCustomEq ? String(customEquipment || 'Custom Activity') : 'Custom Activity'} <Edit3 size={16} />
            </button>
          </div>
          {isEnteringCustomEq && (
            <input type="text" autoFocus placeholder="Name activity..." className="w-full mt-4 bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-blue-500 rounded-xl p-3 font-bold outline-none transition-colors" style={{ color: themeObj.text }} value={customEquipment} onChange={(e) => setCustomEquipment(e.target.value.replace(/[^a-zA-Z0-9 -]/g, ''))} />
          )}
        </Card>
        <Card themeObj={themeObj} className="mb-10 space-y-6">
          {['A', 'B', 'C'].map((z) => (
            <div key={z} className="flex items-center justify-between border-b pb-4" style={{ borderColor: themeObj.border }}>
              <span className="font-black text-lg" style={{ color: themeObj.text }}>Zone {z}</span>
              <input type="text" placeholder="Level" value={metrics[`zone${z}`]} onChange={(e) => setMetrics({ ...metrics, [`zone${z}`]: e.target.value })} className="w-20 text-center font-black text-xl bg-black/5 dark:bg-white/5 rounded-lg py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all" style={{ color: themeObj.primary }} />
            </div>
          ))}
        </Card>
        <Button onClick={() => onComplete({ kind: 'CARDIO', cardio: { elapsed, equipment: isEnteringCustomEq ? (customEquipment.trim() || 'Custom Activity') : equipment, metrics } })} themeObj={themeObj} className="py-5 shadow-lg uppercase tracking-widest mb-10">
          Confirm Stats
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ backgroundColor: '#04070B' }}>
      <AudioGateOverlay
        visible={showAudioGate}
        themeObj={themeObj}
        onEnable={handleAudioUnlock}
        onTest={async () => {
          const ok = await playBeep(740, 0.12, 0.08);
          if (ok) {
            setDb((prev) => ({ ...prev, settings: { ...prev.settings, audioUnlocked: true } }));
            setDismissedAudioGate(true);
          }
        }}
        onDismiss={() => setDismissedAudioGate(true)}
      />
      <BlockedAudioChip beepsEnabled={beepsEnabled} audioUnlocked={audioUnlocked} themeObj={themeObj} onClick={() => setDismissedAudioGate(false)} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className={`absolute inset-0 transition-all duration-300 ${phasePulse ? 'opacity-100' : 'opacity-90'}`}
          style={{ backgroundColor: zoneColor, opacity: phasePulse ? 0.26 : 0.20 }}
        />
        <div
          className="absolute left-0 right-0 bottom-0 transition-all duration-700 ease-linear"
          style={{ height: `${zoneProgressPct}%`, backgroundColor: zoneColor, opacity: 0.86 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.48) 48%, rgba(0,0,0,0.26) 100%)' }} />
      </div>

      <div className="px-6 pt-[safe-lg] flex items-center justify-between z-20">
        <button
          onClick={() => { setElapsed(0); setIsActive(false); setShowSummary(false); }}
          className="h-11 px-4 border rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Reset cardio"
          disabled={isActive && elapsed > 0}
          style={{
            borderColor: 'rgba(255,255,255,0.26)',
            color: '#FFF',
            backgroundColor: 'rgba(0,0,0,0.28)',
            opacity: !isActive && elapsed > 0 ? 1 : 0.35
          }}
        >
          <ResetIcon size={20} />
        </button>

        <button onClick={onCancel} className="h-11 w-11 border rounded-xl flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-white" style={{ borderColor: 'rgba(255,255,255,0.26)', color: '#FFF', backgroundColor: 'rgba(0,0,0,0.28)' }} aria-label="Exit cardio"><X size={22} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 z-20 text-center">
        <p className="text-[12px] font-black uppercase tracking-[0.26em] text-white opacity-60">Round {currentRound} of 5</p>
        <div className={`mt-3 flex items-center gap-3 sm:gap-4 ${isFinalCountdown ? 'animate-pulse' : ''}`}>
          <RestFlipDigits value={cardioMinutes} label="MIN" isUrgent={isFinalCountdown} themeObj={themeObj} large />
          <span className="text-[76px] sm:text-[96px] font-black pb-7" style={{ color: isFinalCountdown ? '#FFD166' : '#F8FAFC' }}>:</span>
          <RestFlipDigits value={cardioSeconds} label="SEC" isUrgent={isFinalCountdown} themeObj={themeObj} large />
        </div>
        <p className="mt-3 text-[34px] font-black uppercase tracking-tight" style={{ color: zoneColor }}>{currentZoneName}</p>
        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-white opacity-60">Next: {nextZone}</p>
        {lastTarget && (
          <p className="mt-4 text-[11px] font-bold text-white opacity-55">Last target: {String(lastTarget[`zone${zone}`] || '—')}</p>
        )}
      </div>

      <WakeLockNotice isSupported={wakeLockSupported} themeObj={themeObj} />

      <div className="px-6 pt-3 pb-[safe-xl] flex flex-col items-center gap-3 z-20" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
        <button
          onClick={async () => {
            await safeResumeAudio();
            setIsActive((v) => !v);
          }}
          className="w-full max-w-[380px] h-16 rounded-2xl border flex items-center justify-center gap-2 shadow-2xl transition-transform active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-white"
          style={{ backgroundColor: themeObj.primary, color: '#FFF' }}
          aria-label={isActive ? 'Pause cardio' : 'Start cardio'}
        >
          {isActive ? <Pause size={24} strokeWidth={3} /> : <Play size={24} strokeWidth={3} className="ml-1" />}
          <span className="text-[14px] font-black uppercase tracking-[0.16em]">{isActive ? 'Pause' : 'Start'}</span>
        </button>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white opacity-55">2:00 A • 2:00 B • 1:00 C rhythm</span>
      </div>
    </div>
  );
}

function CoreFinisher({ db, setDb, onComplete, onCancel, themeObj }) {
  const [elapsed, setElapsed] = useState(600);
  const [isActive, setIsActive] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [tapped, setTapped] = useState(new Set());
  const [roundFlash, setRoundFlash] = useState(false);

  const { isSupported: wakeLockSupported } = useScreenWakeLock(true);

  const beepsEnabled = Boolean(db.settings?.beeps);
  const audioUnlocked = Boolean(db.settings?.audioUnlocked);
  const [dismissedAudioGate, setDismissedAudioGate] = useState(false);
  const showAudioGate = beepsEnabled && !audioUnlocked && !dismissedAudioGate;

  const emitThud = async () => { if (beepsEnabled && audioUnlocked) await playTransitionThud(); };
  const emitHaptic = (style = 'medium') => { if (db.settings?.haptics) triggerHaptic(style); };

  useEffect(() => {
    let int;
    if (isActive && elapsed > 0) {
      int = setInterval(() => {
        setElapsed((p) => {
          if (p <= 3 && p > 0 && beepsEnabled && audioUnlocked) void playBeep(980, 0.05, 0.06);
          if (p <= 1) {
            emitHaptic('heavy');
            void emitThud();
            setIsActive(false);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, elapsed, beepsEnabled, audioUnlocked]);

  const toggleEx = (idx) => {
    if (!isActive) return;
    const next = new Set(tapped);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);

    setTapped(next);

    if (next.size === 4) {
      setRoundFlash(true);
      setRounds((r) => r + 1);
      emitHaptic('medium');
      if (beepsEnabled && audioUnlocked) void playBeep(1200, 0.04, 0.08);
      setTimeout(() => {
        setTapped(new Set());
        setRoundFlash(false);
      }, 260);
    } else {
      emitHaptic('light');
    }
  };

  const handleAudioUnlock = async () => {
    const ok = await unlockAudio();
    if (ok) {
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, audioUnlocked: true } }));
      setDismissedAudioGate(true);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const totalProgressPct = Math.max(0, Math.min(100, ((600 - elapsed) / 600) * 100));

  const exercises = [
    { name: 'Dead Bug', reps: '10 / side' },
    { name: 'RKC Plank', reps: '30 sec' },
    { name: 'Bird Dog', reps: '10 / side' },
    { name: 'Side Plank', reps: '20 sec / side' }
  ];

  const ringSize = 300;
  const ringStroke = 8;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - totalProgressPct / 100);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative" style={{ backgroundColor: themeObj.bg }}>
      <AudioGateOverlay
        visible={showAudioGate}
        themeObj={themeObj}
        onEnable={handleAudioUnlock}
        onTest={async () => {
          const ok = await playBeep(740, 0.12, 0.08);
          if (ok) {
            setDb((prev) => ({ ...prev, settings: { ...prev.settings, audioUnlocked: true } }));
            setDismissedAudioGate(true);
          }
        }}
        onDismiss={() => setDismissedAudioGate(true)}
      />
      <BlockedAudioChip beepsEnabled={beepsEnabled} audioUnlocked={audioUnlocked} themeObj={themeObj} onClick={() => setDismissedAudioGate(false)} />

      <div className="px-6 pt-[safe-lg] pb-4 flex justify-between items-center z-10">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: themeObj.primary }}>Post-Cardio Core</p>
          <h1 className="text-[28px] font-[1000] tracking-tighter uppercase" style={{ color: themeObj.text }}>Round Engine</h1>
        </div>
        <button onClick={onCancel} className="p-3 rounded-full outline-none focus-visible:ring-2" style={{ color: themeObj.text, backgroundColor: themeObj.card }} aria-label="Exit core finisher"><X size={24} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mx-auto max-w-[460px]">
          <div className="relative mx-auto w-[min(82vw,320px)] h-[min(82vw,320px)]">
            <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke={themeObj.border} strokeWidth={ringStroke} />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke={themeObj.primary}
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 0.35s linear' }}
              />
            </svg>

            <div className={`absolute inset-[20%] rounded-full border flex flex-col items-center justify-center text-center transition-transform duration-200 ${roundFlash ? 'scale-105' : 'scale-100'}`} style={{ borderColor: themeObj.border, backgroundColor: themeObj.card }}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: themeObj.text }}>Round Count</span>
              <span className="text-[60px] font-black leading-none tabular-nums" style={{ color: themeObj.text }}>{rounds}</span>
              <span className="text-[12px] font-black uppercase tracking-[0.16em] opacity-60" style={{ color: themeObj.textSecondary }}>{formatTime(elapsed)} remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-7">
            {exercises.map((ex, idx) => {
              const done = tapped.has(idx);
              return (
                <button
                  key={ex.name}
                  onClick={() => toggleEx(idx)}
                  aria-label={`Mark ${ex.name} complete`}
                  className="rounded-2xl border p-4 text-left outline-none focus-visible:ring-4 transition-transform active:scale-[0.98]"
                  style={{ borderColor: done ? themeObj.success : themeObj.border, backgroundColor: done ? `${themeObj.success}22` : themeObj.card }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-black uppercase tracking-tight" style={{ color: themeObj.text }}>{ex.name}</h3>
                    {done && <Check size={18} strokeWidth={3} color={themeObj.success} />}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-60 mt-1" style={{ color: themeObj.textSecondary }}>{ex.reps}</p>
                </button>
              );
            })}
          </div>

          <WakeLockNotice isSupported={wakeLockSupported} themeObj={themeObj} />
        </div>
      </div>

      <div className="p-6 pb-[safe-xl] border-t" style={{ borderColor: themeObj.border, backgroundColor: themeObj.card }}>
        {isActive ? (
          <Button onClick={() => setIsActive(false)} themeObj={themeObj} variant="secondary" className="py-5 uppercase tracking-[0.22em]">Pause Engine</Button>
        ) : (
          <Button onClick={async () => { await safeResumeAudio(); setIsActive(true); }} themeObj={themeObj} className="py-5 uppercase tracking-[0.22em]">
            {elapsed === 600 ? 'Start 10:00 Block' : elapsed > 0 ? 'Resume Block' : 'Block Complete'}
          </Button>
        )}

        {!isActive && (rounds > 0 || elapsed === 0) && (
          <Button onClick={() => onComplete({ kind: 'CORE', core: { rounds } })} themeObj={themeObj} variant="secondary" className="mt-3 py-4 uppercase tracking-[0.2em]">
            Save Core Session
          </Button>
        )}
      </div>
    </div>
  );
}
function HistoryScreen({ db, onBack, themeObj }) {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: themeObj.bg }}>
      <div className="px-6 pt-[safe-md] pb-6 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-[34px] font-[1000] tracking-tighter" style={{ color: themeObj.text }}>History</h1>
          <p className="text-[15px] font-bold mt-1 tracking-tight" style={{ color: themeObj.textSecondary }}>{db.history.length} logged</p>
        </div>
        <button onClick={onBack} className="p-2 rounded-full active:scale-90 bg-opacity-50 outline-none focus-visible:ring-2" style={{ backgroundColor: themeObj.card, color: themeObj.text }} aria-label="Close history"><X size={24} strokeWidth={2.5} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-[calc(8rem+env(safe-area-inset-bottom))] space-y-4">
        {db.history.length === 0 ? (
          <Card themeObj={themeObj} className="border-0 shadow-sm mt-4">
            <h3 className="text-xl font-black uppercase" style={{ color: themeObj.text }}>No sessions yet</h3>
            <p className="mt-2 text-sm opacity-60" style={{ color: themeObj.text }}>Your completed workouts and recovery days will appear here.</p>
          </Card>
        ) : (
          db.history.map((h, i) => (
            <Card key={`${h.date}-${i}`} themeObj={themeObj} className="border-0 shadow-sm mt-4">
              <div className="flex justify-between text-[11px] font-black uppercase mb-1" style={{ color: themeObj.primary }}>
                <span>{h.official ? `Block ${h.block} • Day ${h.slotIndex + 1}` : 'Manual Session'}</span>
                <span style={{ color: themeObj.textSecondary }}>{new Date(h.date).toLocaleDateString()}</span>
              </div>
              <h3 className="text-xl font-black uppercase" style={{ color: themeObj.text }}>
                {h.data?.kind === 'REST' ? 'Recovery Day' : h.data?.kind === 'STRENGTH' ? `${h.data.slotType} SESSION` : h.data?.kind === 'CARDIO+CORE' ? 'CARDIO & CORE' : h.data?.kind}
              </h3>

              {h.data?.workoutLogs && (
                <div className="mt-3 space-y-2 opacity-60 text-xs font-bold" style={{ color: themeObj.text }}>
                  {Object.entries(h.data.workoutLogs).map(([id, logs], idx) => (
                    <div key={`${id}-${idx}`}>• {String(logs?.[0]?.weight || 0)}lb ({Array.isArray(logs) ? logs.map((l) => (l.status === 'success' ? '10' : String(l.reps))).join('•') : ''})</div>
                  ))}
                </div>
              )}
              {h.data?.cardio && (
                <div className="mt-3 text-[12px] font-bold opacity-60" style={{ color: themeObj.text }}>
                  {String(h.data.cardio.equipment || 'Activity')} • Zones: {String(h.data.cardio.metrics?.zoneA || '—')} / {String(h.data.cardio.metrics?.zoneB || '—')} / {String(h.data.cardio.metrics?.zoneC || '—')}
                </div>
              )}
              {h.data?.core && (
                <div className="mt-2 text-[12px] font-bold opacity-60" style={{ color: themeObj.text }}>
                  Core Rounds: {String(h.data.core.rounds ?? '—')}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsScreen({ db, setDb, onBack, themeObj }) {
  const toggleSetting = (key) => setDb((prev) => ({ ...prev, settings: { ...prev.settings, [key]: !prev.settings[key] } }));

  const handleExport = async () => {
    await exportBackupJSON(`myobound_backup_${new Date().toISOString().split('T')[0]}.json`, db);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.history && parsed.plan) {
          if (typeof window !== 'undefined' && window.confirm('Overwrite current data with imported backup?')) {
            setDb(parsed);
          }
        } else {
          alert('Invalid backup file.');
        }
      } catch {
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto pb-[calc(8rem+env(safe-area-inset-bottom))]" style={{ backgroundColor: themeObj.bg }}>
      <div className="pt-[safe-md] mb-8 flex justify-between items-center">
        <h1 className="text-[34px] font-[1000] tracking-tighter" style={{ color: themeObj.text }}>Settings</h1>
        <button onClick={onBack} className="p-2 rounded-full outline-none focus-visible:ring-2" style={{ backgroundColor: themeObj.card }} aria-label="Close settings"><X size={24} color={themeObj.text} /></button>
      </div>

      <Card themeObj={themeObj} className="mb-4 flex justify-between items-center shadow-sm border-0">
        <span className="font-bold" style={{ color: themeObj.text }}>Appearance</span>
        <button aria-label="Toggle appearance" onClick={() => setDb((prev) => ({ ...prev, settings: { ...prev.settings, theme: prev.settings.theme === 'dark' ? 'light' : 'dark' } }))} className="p-3 rounded-full border-2 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-blue-500" style={{ backgroundColor: themeObj.bg, borderColor: themeObj.border, color: themeObj.text }}>
          {db.settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </Card>

      <Card themeObj={themeObj} className="mb-4 flex justify-between items-center shadow-sm border-0">
        <div className="flex items-center gap-3" style={{ color: themeObj.text }}><Volume2 size={18} /><span className="font-bold">Beeps / Tones</span></div>
        <button onClick={() => toggleSetting('beeps')} className="px-4 py-2 rounded-full border-2 text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-4 focus-visible:ring-blue-500" style={{ borderColor: db.settings.beeps ? themeObj.primary : themeObj.border, backgroundColor: db.settings.beeps ? themeObj.primary : 'transparent', color: db.settings.beeps ? '#FFF' : themeObj.textSecondary }}>
          {db.settings.beeps ? 'On' : 'Off'}
        </button>
      </Card>

      {db.settings.beeps && (
        <Card themeObj={themeObj} className="mb-4 flex justify-between items-center shadow-sm border-0">
          <div className="flex items-center gap-3" style={{ color: themeObj.text }}><Zap size={18} /><span className="font-bold">Sound Unlock</span></div>
          <button
            onClick={async () => {
              const ok = await unlockAudio();
              if (ok) {
                setDb((prev) => ({ ...prev, settings: { ...prev.settings, audioUnlocked: true } }));
              }
            }}
            className="px-4 py-2 rounded-full border-2 text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-4 focus-visible:ring-blue-500"
            style={{ borderColor: db.settings.audioUnlocked ? themeObj.success : themeObj.border, backgroundColor: db.settings.audioUnlocked ? themeObj.success : 'transparent', color: db.settings.audioUnlocked ? '#000' : themeObj.textSecondary }}
          >
            {db.settings.audioUnlocked ? 'Unlocked' : 'Enable'}
          </button>
        </Card>
      )}

      <Card themeObj={themeObj} className="mb-6 flex justify-between items-center shadow-sm border-0">
        <div className="flex items-center gap-3" style={{ color: themeObj.text }}><Vibrate size={18} /><span className="font-bold">Haptics <span className="text-[10px] font-normal opacity-50">(Android)</span></span></div>
        <button onClick={() => toggleSetting('haptics')} className="px-4 py-2 rounded-full border-2 text-xs font-black uppercase tracking-widest outline-none focus-visible:ring-4 focus-visible:ring-blue-500" style={{ borderColor: db.settings.haptics ? themeObj.primary : themeObj.border, backgroundColor: db.settings.haptics ? themeObj.primary : 'transparent', color: db.settings.haptics ? '#FFF' : themeObj.textSecondary }}>
          {db.settings.haptics ? 'On' : 'Off'}
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button variant="secondary" onClick={handleExport} themeObj={themeObj} className="shadow-sm py-4 text-sm"><Download size={18} /> Backup</Button>
        <label className="w-full py-4 rounded-[18px] font-[700] text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer shadow-sm border outline-none focus-within:ring-4 focus-within:ring-blue-500" style={{ backgroundColor: themeObj.bg, color: themeObj.text, borderColor: themeObj.border }}>
          <Upload size={18} /> Restore
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>

      <Button variant="danger" className="py-5 shadow-md mb-6" themeObj={themeObj} onClick={() => { if (typeof window !== 'undefined' && window.confirm('Reset all progress and exercises?')) setDb(createDefaultState()); }}>
        Reset All App Data
      </Button>
    </div>
  );
}

// =====================================================
// MAIN APP
// =====================================================

export default function App() {
  const [db, setDb] = useState(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState('WELCOME');
  const [pendingCardio, setPendingCardio] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const saved = await readJSON(DB_STORAGE_KEY, null);
      const audioUnlockedFlag = await readBool(AUDIO_UNLOCK_KEY, false);
      const merged = mergeLoadedState(saved, audioUnlockedFlag);

      if (cancelled) return;
      setDb(merged);
      setScreen(merged.onboarded ? 'HUB' : 'WELCOME');
      setHydrated(true);
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const t = setTimeout(() => {
      void writeJSON(DB_STORAGE_KEY, db);
      void writeBool(AUDIO_UNLOCK_KEY, Boolean(db.settings?.audioUnlocked));
    }, 200);
    return () => clearTimeout(t);
  }, [db, hydrated]);

  const themeObj = db.settings.theme === 'dark' ? COLORS.dark : COLORS.light;

  const handleComplete = (data, isManual = false) => {
    const entry = {
      date: new Date().toISOString(),
      block: isManual ? null : db.currentBlock,
      slotIndex: isManual ? -1 : db.currentSlotIndex,
      official: !isManual,
      data
    };

    const nextIdx = isManual ? db.currentSlotIndex : db.currentSlotIndex + 1;

    if (!isManual && nextIdx >= 42) {
      const oldNames = [...(db.plan.upper || []), ...(db.plan.lower || [])].map((e) => e.name);

      setDb((prev) => ({
        ...prev,
        history: [entry, ...prev.history],
        onboarded: false,
        officialStarted: false,
        currentSlotIndex: 0,
        currentBlock: prev.currentBlock + 1,
        usedInLastBlock: oldNames
      }));
      setScreen('WELCOME');
      return;
    }

    setDb((prev) => ({
      ...prev,
      history: [entry, ...prev.history],
      currentSlotIndex: nextIdx
    }));
    setScreen('HUB');
  };

  const render = () => {
    switch (screen) {
      case 'WELCOME':
        return <WelcomeScreen onNext={() => setScreen('SETUP')} themeObj={themeObj} />;
      case 'SETUP':
        return <SetupWizard db={db} setDb={setDb} onComplete={() => setScreen('HUB')} themeObj={themeObj} />;
      case 'HUB':
        return <HubScreen db={db} setDb={setDb} onNavigate={setScreen} themeObj={themeObj} />;
      case 'STRENGTH':
        return <StrengthWorkout db={db} setDb={setDb} onComplete={handleComplete} onCancel={() => setScreen('HUB')} themeObj={themeObj} />;
      case 'STRENGTH_UPPER':
        return <StrengthWorkout db={db} setDb={setDb} workoutTypeOverride="UPPER" onComplete={(d) => handleComplete(d, true)} onCancel={() => setScreen('HUB')} themeObj={themeObj} />;
      case 'STRENGTH_LOWER':
        return <StrengthWorkout db={db} setDb={setDb} workoutTypeOverride="LOWER" onComplete={(d) => handleComplete(d, true)} onCancel={() => setScreen('HUB')} themeObj={themeObj} />;
      case 'CARDIO':
        return <CardioWorkout db={db} setDb={setDb} onComplete={(d) => { setPendingCardio(d.cardio); setScreen('CORE'); }} onCancel={() => { setPendingCardio(null); setScreen('HUB'); }} themeObj={themeObj} />;
      case 'MANUAL_CARDIO':
        return <CardioWorkout db={db} setDb={setDb} onComplete={(d) => { setPendingCardio(d.cardio); setScreen('MANUAL_CORE'); }} onCancel={() => { setPendingCardio(null); setScreen('HUB'); }} themeObj={themeObj} />;
      case 'CORE':
        return <CoreFinisher db={db} setDb={setDb} onComplete={(d) => { handleComplete({ kind: 'CARDIO+CORE', cardio: pendingCardio, core: d.core }); setPendingCardio(null); }} onCancel={() => { setPendingCardio(null); setScreen('HUB'); }} themeObj={themeObj} />;
      case 'MANUAL_CORE':
        return <CoreFinisher db={db} setDb={setDb} onComplete={(d) => { if (pendingCardio) handleComplete({ kind: 'CARDIO+CORE', cardio: pendingCardio, core: d.core }, true); else handleComplete(d, true); setPendingCardio(null); }} onCancel={() => { setPendingCardio(null); setScreen('HUB'); }} themeObj={themeObj} />;
      case 'HISTORY':
        return <HistoryScreen db={db} onBack={() => setScreen('HUB')} themeObj={themeObj} />;
      case 'SETTINGS':
        return <SettingsScreen db={db} setDb={setDb} onBack={() => setScreen('HUB')} themeObj={themeObj} />;
      case 'OFF':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: themeObj.bg, color: themeObj.text }}>
            <RotateCcw size={80} className="mb-6 opacity-30" />
            <h1 className="text-4xl font-black mb-4 uppercase leading-tight">Rest Day</h1>
            <p className="text-lg opacity-60 font-medium mb-10 leading-relaxed">Hydrate and recover.</p>
            <Button onClick={() => handleComplete({ kind: 'REST' })} themeObj={themeObj}>Confirm Recovery</Button>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: themeObj.bg, color: themeObj.text }}>
            <Button onClick={() => setScreen('HUB')} themeObj={themeObj}>Return to Hub</Button>
          </div>
        );
    }
  };

  if (!hydrated) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: themeObj.bg, color: themeObj.text }}>
        <span className="text-sm font-bold opacity-70">Loading MyoBound...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden font-sans select-none relative transition-colors duration-300 antialiased" style={{ backgroundColor: themeObj.bg, color: themeObj.text }}>
      {render()}
      {['HUB', 'HISTORY', 'SETTINGS'].includes(screen) && <BottomNav currentScreen={screen} onNavigate={setScreen} themeObj={themeObj} />}
    </div>
  );
}
