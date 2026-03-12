## MyoBound — Completion-Facing Handoff Document
**Generated: 2026-03-11 | Every claim verified against current repository state**

---

### 1. Product Identity

**MyoBound** is a structured workout training app for iOS, built as a Next.js 15 static export wrapped in Capacitor 7. The app delivers a 6-week block-based training program with strength (upper/lower), cardio (zone-based intervals), and core stability sessions.

- **App ID:** `com.aaronknudson.myobound`
- **iOS Minimum:** 16.0
- **Tagline:** "Systematic Adaptation. Precision Training."

---

### 2. Source of Truth

The core application logic is concentrated in `app/page.jsx`, with supporting files elsewhere in the repo:

| File | Lines | Role |
|---|---|---|
| `app/page.jsx` | 2,179 | All components, all state, all workout logic |
| `lib/native.js` | 133 | Capacitor abstraction (Preferences, Haptics, KeepAwake, Filesystem, Share) |
| `app/layout.js` | 20 | Root HTML shell with viewport config (`viewportFit: 'cover'`) |
| `app/globals.css` | 86 | Tailwind imports, safe-area utilities, flip-digit animation keyframes |
| `app/privacy/page.jsx` | 23 | App Store privacy policy page (local-only data, no tracking) |
| `app/support/page.jsx` | 19 | App Store support page (email contact) |
| `capacitor.config.json` | 11 | App ID, `webDir: "out"`, iOS min 16.0 |
| `next.config.mjs` | 10 | Static export, unoptimized images, trailing slash |
| `tailwind.config.js` | 8 | Content: `./app/**/*.{js,jsx,ts,tsx}`, no extensions |
| `package.json` | 32 | Scripts: `dev`, `build`, `cap:sync:ios`, `cap:open:ios` |

**There is no routing, no API, no database, no server.** All data is persisted via Capacitor Preferences (native) or localStorage (web) under the key `myobound_db` as a single JSON blob. A secondary key `myobound_audioUnlocked` stores the audio-unlock flag separately (dual-persisted: also inside the main blob at `settings.audioUnlocked`, merged on hydration via `normalizeDb`).

---

### 3. What Is Completed

**Core 5/25 System:**
- 36-workout block model with 6-week slot generation (UPPER/LOWER/CARDIO/OFF pattern, alternating week A/B) — `generateBlockSlots()` at line 96
- 10-step Setup Wizard (5 upper + 5 lower exercise selections with curated options + "User Choice" custom entry) — `SetupWizard` at line 479
- 5-cycle × 5-exercise strength workout with swipe-to-complete gesture (right = success at 10 reps, left = limit prompt for 5–9 reps) — `SwipeableExerciseRow` at line 802, threshold 90px
- Per-exercise progression advice via `getAdviceForExercise()` at line 212: CALIBRATION → REDUCE RESISTANCE / KEEP RESISTANCE / INCREASE RESISTANCE
- Per-exercise ease rating at finalize time (only for exercises with 5/5 success, no limits) — `perfectExercises` computed at line 1131, ease toggle at lines 1335–1358
- Block completion at 36th non-REST workout → Block Review screen → forced exercise re-selection — `handleComplete()` at line 2038
- `usedInLastBlock` array disables previously-selected exercises in Setup Wizard — line 561
- Core combo rotation by block number: `((currentBlock - 1) % 4) + 1` — line 1693

**Cardio System:**
- 5 rounds × (2:00 Zone A + 2:00 Zone B + 1:00 Zone C) = 25 minutes total — `CardioWorkout` at line 1374
- Zone-colored fill animation rising from bottom of screen
- Equipment selection (6 presets + custom) on summary screen — line 1481
- Zone metric input (level/speed per zone) on summary screen — line 1493
- Last-session target display during active cardio — line 1566
- Early exit: "Finish Cardio & Log" button appears when paused with elapsed > 0 — `handleFinishEarly` at line 1470, button at lines 1597–1606
- Cardio → Core pipeline: completing cardio stores `pendingCardio` then routes to `CoreFinisher`; both saved as single `CARDIO+CORE` history entry — lines 2078, 2082

**Core Stability:**
- 10-minute countdown timer (`elapsed` initialized to 600) — `CoreFinisher` at line 1612
- 4 exercises in 2×2 grid (from `CORE_COMBOS` at lines 64–88), tap to mark complete
- Round auto-increments when all 4 tapped — line 1661
- Save enabled when timer expires or paused with rounds > 0 — `canSaveCoreSession` at line 1688

**Infrastructure:**
- Dark/light theme: dark default (`#000000` bg, `#1C1C1E` cards), light available (`#F2F2F7` bg, white cards) — `COLORS` at lines 92–93
- Web Audio API beep engine: `getAudioCtx()` singleton, `safeResumeAudio()` for iOS gesture-based unlock, `enqueueAudio()` queue, `playBeep()` with configurable frequency/volume/duration — lines 227–288
- `playTransitionThud()` (350 Hz, vol 0.1, 0.4s duration) used at cycle/zone/round transitions — line 298
- Haptics via Capacitor native + web vibrate fallback — `lib/native.js` line 52
- Screen wake lock via KeepAwake + WakeLock API fallback — `lib/native.js` line 71, hook at line 322
- JSON backup export (Filesystem + Share sheet on iOS, Blob download on web) — `lib/native.js` line 100
- JSON backup import with validation — `SettingsScreen` line 1897
- Full reset with confirmation — line 1959
- Debounced auto-persist (200ms) on every `db` change — line 2000
- `normalizeDb()` migration layer at line 140: safely merges any saved data with current defaults, never crashes on malformed input
- Bottom navigation (Today / History / Settings) — `BottomNav` at line 406

**Completed UX/UI Polish (all verifiable in current code):**
- Progression terminology: REDUCE RESISTANCE / KEEP RESISTANCE / INCREASE RESISTANCE — lines 217–220
- Progression logic uses chronological `findIndex()` (no `.reverse()`) — line 214
- Passive AudioContext arming via `void safeResumeAudio()` in swipe `handleEnd()` — line 861
- Beep volumes: strength rest 0.11 (line 1111), set completion 0.10 (line 1309), cardio zone 0.11 (line 1442), core countdown 0.11 (line 1632), core round 0.12 (line 1664)
- Rest hint copy: "reduce resistance" / "keep resistance" — lines 1143–1144
- Durable exercise name snapshot: `exerciseNames` map saved at finalize time in `buildStrengthPayload()` — line 1169
- History name rendering: 3-tier resolution (snapshot → `db.plan` fallback → omit) — lines 1863–1865
- Haptics label: "(Android)" removed — line 1945
- Hub CTA: filled `themeObj.primary` background, white text — line 749
- Ease-rating: vertical rows layout (name on left with wrapping, "Easy" button on right) — lines 1335–1358

---

### 4. Current User Flows

**First Launch:**
WELCOME → "Engage Protocol" → SETUP (10-step picker) → HUB

**Returning Launch:**
Hydrate from Preferences → `getInitialScreen()` (line 206) → HUB (or BLOCK_REVIEW if `pendingBlockReview`, or SETUP if `!onboarded`)

**Official Strength Workout:**
HUB → tap Active Protocol card → STRENGTH (auto-detects UPPER/LOWER from current slot) → swipe through 5 cycles → auto 2:00 rest between cycles → ease rating for perfect exercises → Finalize → `handleComplete()` saves entry → HUB

**Official Cardio + Core:**
HUB → Active Protocol (CARDIO slot) → CARDIO timer → summary (equipment + zone levels) → Confirm Stats → `pendingCardio` stored → CORE finisher → Save Core → combined `CARDIO+CORE` entry → HUB

**Manual Sessions (Training Modules grid):**
HUB → tap Upper/Lower/Cardio/Stability card → workout screen → complete → saved with `official: false`, `block: null`, `slotIndex: -1` — does NOT increment `workoutsCompletedInBlock` or advance `currentSlotIndex`

**Manual Core without preceding Cardio:**
HUB → Stability module → CoreFinisher → Save → standalone `CORE` entry (line 2084: `else handleComplete(d, true)` when `pendingCardio` is null)

**Block Completion:**
36th non-REST workout → BLOCK_REVIEW screen → "Start Block N+1" → plan cleared, `onboarded: false` → SETUP wizard (line 2096)

**Off Day:**
HUB (OFF slot active) → "Confirm Recovery" → REST entry saved → slot advances → HUB

---

### 5. Current Data Model

**`db` state shape (key: `myobound_db`):**

```
{
  dbVersion: 2,
  onboarded: boolean,
  officialStarted: boolean,
  pendingBlockReview: boolean,
  currentBlock: number (1+),
  currentSlotIndex: number (0+),
  workoutsCompletedInBlock: number (0-36),
  plan: {
    upper: [{ id, name, sets: 5, reps: '10' }, ...],  // 5 exercises
    lower: [{ id, name, sets: 5, reps: '10' }, ...]   // 5 exercises
  },
  usedInLastBlock: string[],  // exercise names from previous block
  slots: [{ type: 'UPPER'|'LOWER'|'CARDIO'|'OFF', week: 1-6, day: 1-7 }, ...],  // 42 slots
  history: [ <history entries, newest first> ],
  coreProgram: {              // ⚠️ SCHEMA ONLY — no UI reads/writes these fields
    mode: 'auto',             // always 'auto'; manual mode UI not built
    selectedComboId: null,    // always null; active combo derived from block number
    customByCombo: { combo1: {}, combo2: {}, combo3: {}, combo4: {} }
  },
  settings: {
    theme: 'dark' | 'light',
    haptics: boolean,
    beeps: boolean,
    audioUnlocked: boolean    // also dual-persisted under separate key
  }
}
```

**History entry shapes:**

```
// Every entry:
{ date: ISO, block: number|null, slotIndex: number, official: boolean, data: {...} }

// STRENGTH (official or manual):
data: {
  kind: 'STRENGTH',
  slotType: 'UPPER' | 'LOWER',
  elapsed: seconds,
  workoutLogs: { [exerciseId]: [{ status: 'success'|'limit', reps: number, weight }] },
  exerciseNames: { [exerciseId]: string },       // durable snapshot (added recently)
  exerciseEaseRatings: { [exerciseId]: 'easy'|'challenging' },
  totalSets: number,
  completedSets: number
}

// CARDIO+CORE (combined, official or manual):
data: {
  kind: 'CARDIO+CORE',
  cardio: { elapsed, equipment: string, metrics: { zoneA, zoneB, zoneC } },
  core: { rounds: number }
}

// CORE (standalone, manual only — when launched from Stability module without cardio):
data: { kind: 'CORE', core: { rounds: number } }

// REST (official only):
data: { kind: 'REST' }
```

Note: A standalone `kind: 'CARDIO'` is emitted by `CardioWorkout.onComplete` (line 1500) but all current routing intercepts it as `pendingCardio` and combines it with core into `CARDIO+CORE`. No code path saves a standalone `CARDIO` entry to history. However, line 604 in HubScreen defensively checks for it, suggesting legacy data may contain it.

**Exercise ID patterns:**
- Curated: `{lane}_{categoryKey}_{slugified_name}` (e.g., `upper_chest_dumbbell_flat_bench_press`)
- Custom: `custom_{timestamp}_{random}` (e.g., `custom_1741234567890_42`)

---

### 6. Current UX/UI State

**Visual System:**
- Dark default: pure black `#000000` bg, `#1C1C1E` cards, `#0A84FF` primary
- Light: `#F2F2F7` bg, `#FFFFFF` cards, `#007AFF` primary
- Accent colors: success `#00FF87`, danger `#FF0055`, seafoam `#4FD1C5`/`#38B2AC`
- Cardio zones: A = `#00FF87`, B = `#FFD700`, C = `#FF0055`
- Typography: heavy use of `font-black`, `tracking-tighter`, uppercase labels
- Corners: 18–24px border-radius throughout
- Glassmorphism headers with `backdrop-blur-xl`
- Decorative gradient blobs on Hub and module cards

**Component Inventory (all in `app/page.jsx`):**

| Component | Line | Notes |
|---|---|---|
| `Card` | 353 | Reusable rounded card |
| `Button` | 367 | primary/secondary/danger; calls `safeResumeAudio()` on click |
| `TimerOverlay` | 390 | **⚠️ Dead code — defined, never called** |
| `BottomNav` | 406 | Today/History/Settings tab bar |
| `WakeLockNotice` | 444 | Subtle notice when wake lock unsupported |
| `WelcomeScreen` | 459 | Animated landing with Zap icon |
| `SetupWizard` | 479 | 10-step exercise picker |
| `HubScreen` | 593 | Hero card + 4 module cards + progress bar |
| `SwipeableExerciseRow` | 802 | Swipe gesture, weight input, progression advice |
| `RestFlipDigits` | 1002 | Flip-clock digit animation for all timers |
| `StrengthWorkout` | 1056 | Orchestrates exercises, rest, ease rating, finalization |
| `CardioWorkout` | 1374 | Zone timer, visual fill, summary, early exit |
| `CoreFinisher` | 1612 | 10-min countdown + 4-exercise grid + rounds |
| `HistoryScreen` | 1832 | Reverse-chronological log with name resolution |
| `SettingsScreen` | 1890 | Toggles, backup/restore, reset |
| Block Review | 2089 | Inline in `render()` switch |
| Off/Rest Day | 2146 | Inline in `render()` switch |

---

### 7. Highest-Priority Remaining Work

**Observable from current code (not from prior discussion):**

1. **Core combo label missing** — `CoreFinisher` header (lines 1699–1701) shows "Post-Cardio Core / Stability" but does not indicate which of the 4 combos is active. The `activeComboId` is computed (line 1693) but never displayed.

2. **Cardio equipment resets every session** — `CardioWorkout` initializes `equipment` to `'Treadmill'` (line 1378) with no persistence of the previous choice.

3. **All audio cues are identical sine-wave beeps** — `playBeep()` takes frequency/volume/duration but every countdown beep across all workout types uses nearly identical parameters (980–1040 Hz, 0.11 vol, 0.06s). No ascending pattern, no distinct transition chime. The only differentiated sound is `playTransitionThud` (350 Hz, 0.4s).

4. **"Reset All Data" has no visual separation from other settings** — The danger button (line 1959) sits directly below the backup/restore grid with only `mb-6` spacing and no section divider or warning zone.

5. **`coreProgram` schema is dead weight** — `mode`, `selectedComboId`, and `customByCombo` are stored/migrated but no UI reads or writes them. Active combo is always derived from block number.

**Deferred Items (documented in README lines 76–81):**
- Structured deload protocol
- Multi-block progression history or long-term tracking
- Server-side backup or cloud sync
- Automated testing suite

---

### 8. Things That Must Not Be Broken

1. **36-workout block model** — Block completes at 36 non-REST workouts (line 2038), not 42 calendar slots. OFF/REST days advance `currentSlotIndex` but do not increment `workoutsCompletedInBlock` (`workoutIncrement` is 0 for REST at line 2034).

2. **5-cycle strength structure** — Cycle advances only when ALL exercises have completed the current cycle (`currentCycleFloor` = `Math.min(...)` across exercises, line 1084). Rest timer (2:00) triggers between cycles, not between exercises (line 1095).

3. **Progression logic in `getAdviceForExercise()`** — Uses chronological `findIndex()` directly (line 214). First limit in cycles 1–3 → REDUCE RESISTANCE, cycles 4–5 → KEEP RESISTANCE, no limits + ease "easy" → INCREASE RESISTANCE, else KEEP RESISTANCE.

4. **`normalizeDb()` migration safety** — Must produce valid state from any input (lines 140–203). Never crashes on malformed data. Merges with `createDefaultState()` defaults.

5. **Forced re-selection on block transition** — `handleStartNextBlock()` (line 2096) clears `plan`, sets `onboarded: false`, routes to SETUP. `usedInLastBlock` prevents re-picking.

6. **Manual session exclusion** — Manual sessions stored with `official: false`. Official `pastWorkout` lookup filters by `h.official !== false` (line 1075). Manual sessions must not influence official progression advice.

7. **Core combo rotation** — `((currentBlock - 1) % 4) + 1` (line 1693). Must stay in sync with block number.

8. **Swipe gesture integrity** — `SWIPE_THRESHOLD = 90` (line 821). Vertical/horizontal disambiguation at line 845 prevents accidental set logging during scroll.

9. **Durable exercise name snapshot** — `buildStrengthPayload()` saves `exerciseNames` (line 1169). History rendering uses 3-tier: snapshot → `db.plan` fallback → graceful omission (lines 1863–1865).

10. **AudioContext iOS lifecycle** — `safeResumeAudio()` called during user gestures: swipe `handleEnd()` (line 861), `Button` `onClick` (line 378), cardio play/pause (line 1579), core start (line 1785).

---

### 9. Known Technical Debt

| Item | Location | Notes |
|---|---|---|
| **Dead code: `playCountdownTriple`** | Line 290 | Defined, zero call sites (grep-confirmed) |
| **Dead code: `unlockAudio`** | Line 302 | Defined, zero call sites (grep-confirmed) |
| **Dead code: `TimerOverlay`** | Line 390 | Component defined, zero call sites (grep-confirmed) |
| **Dead schema: `coreProgram`** | Lines 108–117 | `mode`, `selectedComboId`, `customByCombo` stored/migrated but never read by UI. Active combo derived from block number. |
| **No tests** | — | Zero test files exist in the repository. |
| **`window.confirm()` / `alert()`** | Lines 1183, 1190, 1905, 1913, 1959 | Native browser dialogs, not themed. |
| **Cardio equipment not persisted** | Line 1378 | Defaults to `'Treadmill'` every session. |
| **`eslint-disable-next-line` suppressions** | Lines 1102, 1123, 1460, 1644 | 4 instances suppressing `react-hooks/exhaustive-deps` in timer effects. Intentional (timer callbacks reference stale closures by design). |
| **README stale terminology** | `README.md` line 69 | Still says "KEEP LOAD" and "INCREASE LOAD" — code uses "KEEP RESISTANCE" and "INCREASE RESISTANCE". **A future assistant reading README first will get conflicting info.** |
| **Dual audio-unlock persistence** | Lines 2002, 44 | `settings.audioUnlocked` written inside main DB blob AND separately under `myobound_audioUnlocked` key. Both merged on hydration (line 199). Works but is a non-obvious pattern. |
| **CocoaPods Ruby 4.0 UTF-8** | Build pipeline | `pod install` may fail with `Encoding::CompatibilityError` on Ruby 4.0 systems. Workaround: `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --project-directory=ios/App` |

---

### 10. Repository Status

**Repository snapshot (as of 2026-03-11):**

| Property | Value |
|---|---|
| **Branch** | `main` |
| **Latest commit** | `5b3b649883fab28e1d1cb11abc2790786462ac29` |
| **Commit subject** | "Align 5/25 app behavior with program spec" |
| **Commit date** | 2026-03-11 14:15:48 -0500 |
| **Working tree** | **Dirty** — `app/page.jsx` has uncommitted modifications |
| **Remote** | `origin` → `https://github.com/ExegeticalLabs/5_25_codex.git` |
| **Push state** | Latest commit (`5b3b649`) is pushed to `origin/main`. All UX/UI polish work (terminology fix, audio reliability, cardio early exit, history names, Hub CTA, ease-rating layout, haptics label, beep volumes) exists only as uncommitted local changes in `app/page.jsx`. |

**Build commands:**
```bash
npm run dev              # Next.js dev server (web preview)
npm run build            # Static export to /out
npm run cap:sync:ios     # Build + sync to iOS (may need LANG fix for pod install)
npm run cap:open:ios     # Open Xcode
```

**CocoaPods workaround (if `pod install` fails):**
```bash
npm run build && npx cap sync ios --no-build
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --project-directory=ios/App
```

**Dependencies (from `package.json`):**
- Next.js 15.2+, React 19, Capacitor 7 (core, ios, cli)
- Capacitor plugins: Preferences, Haptics, KeepAwake, Filesystem, Share
- lucide-react 0.542+ (icons)
- Tailwind CSS 3.4, PostCSS, Autoprefixer

**Git:** `.gitignore` excludes `node_modules/`, `.next/`, `out/`, `.DS_Store`, `.env*`, `.claude/`

---

### 11. Best Re-Onboarding Prompt

> You are continuing development on **MyoBound**, an iOS workout app built with Next.js 15 + React 19 (static export) wrapped in Capacitor 7. The core application logic is concentrated in `app/page.jsx` (~2,179 lines), with a native bridge in `lib/native.js` (133 lines) and supporting config/style files. There is no routing, no API, and no database — all state is a single JSON blob persisted via Capacitor Preferences under the key `myobound_db`.
>
> The app implements a 36-workout block training system: 5-cycle × 5-exercise strength sessions with swipe-to-complete gesture, zone-based cardio intervals (2:00 A / 2:00 B / 1:00 C × 5 rounds = 25 min), and timed core stability finishers (10-min countdown, 4 exercises per round). Progression advice (CALIBRATION / REDUCE RESISTANCE / KEEP RESISTANCE / INCREASE RESISTANCE) is driven by per-exercise ease ratings and limit-cycle detection in `getAdviceForExercise()`.
>
> **Critical constraint:** Do not change core 5/25 behavior. Do not refactor the architecture. Do not add major new features without explicit approval. All changes should be minimal, safe, and approved one at a time.
>
> **⚠️ WARNING:** The README's "Alignment Completed" section uses stale terminology ("KEEP LOAD" / "INCREASE LOAD"). The code uses "KEEP RESISTANCE" / "INCREASE RESISTANCE". Trust the code, not the README.
>
> **⚠️ REPO STATE:** As of 2026-03-11, all UX/UI polish work is uncommitted local changes to `app/page.jsx`. The last commit (`5b3b649`) on `main` predates these changes.
>
> Read `app/page.jsx` in full before making any changes. Key functions: `getAdviceForExercise()` (line ~212), `normalizeDb()` (line ~140), `buildStrengthPayload()` (line ~1159), `handleComplete()` (line ~2017), screen routing in `render()` (line ~2063).

---

### 12. Executive Summary

MyoBound is a fully functional iOS workout app with a complete training system: 36-workout block model, 5-cycle strength sessions with swipe gestures and progressive overload advice, zone-based cardio intervals, and timed core stability finishers. The core application logic is concentrated in `app/page.jsx`, with a Capacitor native bridge and standard config/style files supporting it.

A UX/UI polish pass addressed 10 items: progression terminology, a `.reverse()` cycle-detection bug, audio reliability, rest hint copy, cardio early exit, durable history exercise names, Hub CTA affordance, ease-rating layout, haptics label, and beep volumes. All polish work exists as uncommitted local changes; the last pushed commit predates it. The remaining work items are cosmetic or quality-of-life (core combo label, equipment persistence, sound design variety, settings layout).

The codebase has 3 pieces of dead code (`playCountdownTriple`, `unlockAudio`, `TimerOverlay`), dead schema (`coreProgram` fields), stale README terminology, and zero test coverage. The app is buildable and syncable to iOS via Capacitor.
