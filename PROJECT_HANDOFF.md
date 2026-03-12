# MyoBound — Completion-Facing Handoff Document

**Generated: 2026-03-12 | Every claim verified against current repository state at commit `c18fbaa`**

---

## 1. Product Identity

**MyoBound** is a structured workout training app for iOS, built as a Next.js 15 static export wrapped in Capacitor 7. The app delivers a block-based training program (the "5/25" method) with strength (upper/lower), zone-based cardio intervals, and core stability sessions.

- **App ID:** `com.aaronknudson.myobound`
- **iOS Minimum:** 16.0
- **Tagline:** "Systematic Adaptation. Precision Training."
- **Stage:** Feature-complete for core training loop. UX/UI polish in progress. No App Store release yet. No test suite.
- **Repository:** `https://github.com/ExegeticalLabs/5_25_codex.git`

---

## 2. Source of Truth

The core application logic is concentrated in `app/page.jsx`, with supporting files elsewhere in the repo:

| File | Lines | Role |
|---|---|---|
| `app/page.jsx` | 2,142 | All components, all state, all workout logic |
| `lib/native.js` | 132 | Capacitor abstraction (Preferences, Haptics, KeepAwake, Filesystem, Share) |
| `app/layout.js` | 20 | Root HTML shell with viewport config (`viewportFit: 'cover'`) |
| `app/globals.css` | 86 | Tailwind imports, safe-area utilities, flip-digit animation keyframes |
| `app/privacy/page.jsx` | 23 | App Store privacy policy page (local-only data, no tracking) |
| `app/support/page.jsx` | 19 | App Store support page (email contact: support@myobound.app) |
| `capacitor.config.json` | 11 | App ID, `webDir: "out"`, iOS min 16.0 |
| `next.config.mjs` | 10 | Static export (`output: 'export'`), unoptimized images, trailing slash |
| `tailwind.config.js` | 8 | Content: `./app/**/*.{js,jsx,ts,tsx}`, no extensions |
| `package.json` | 32 | Scripts: `dev`, `build`, `cap:sync:ios`, `cap:open:ios` |

**Architecture:** There is no routing, no API, no database, no server. All data is persisted via Capacitor Preferences (native) or localStorage (web) under the key `myobound_db` as a single JSON blob. A secondary key `myobound_audioUnlocked` stores the audio-unlock flag separately (dual-persisted: also inside the main blob at `settings.audioUnlocked`, merged on hydration via `normalizeDb`).

**Doctrine documentation:** The 5/25 training method is documented in `PROGRAM_DOCTRINE.md`. The `README.md` contains an "Alignment Completed" section describing 5 alignment items verified against the external 5/25 Master Guide. The Master Guide itself is not stored in this repository.

---

## 3. What Is Completed

### Core 5/25 System (code-verified)

| Feature | Location | Status |
|---|---|---|
| 36-workout block model with 6-week slot generation (UPPER/LOWER/CARDIO/OFF, alternating week A/B) | `generateBlockSlots()` line 96 | code-verified |
| 10-step Setup Wizard (5 upper + 5 lower exercise selections with curated options + "User Choice" custom entry) | `SetupWizard` line 443 | code-verified |
| 5-cycle × 5-exercise strength workout with swipe-to-complete gesture (right = success at 10 reps, left = limit prompt for 5–9 reps) | `SwipeableExerciseRow` line 766, threshold 90px | code-verified |
| Per-exercise progression advice: CALIBRATION → REDUCE/KEEP/INCREASE RESISTANCE | `getAdviceForExercise()` line 212 | code-verified |
| Per-exercise ease rating at finalize time (only for exercises with 5/5 success, no limits) | `perfectExercises` computed at line 1095, ease toggle in StrengthWorkout render | code-verified |
| Block completion at 36th non-REST workout → Block Review screen → forced exercise re-selection | `handleComplete()` line 1981, `handleStartNextBlock()` line 2060 | code-verified |
| `usedInLastBlock` disables previously-selected exercises in Setup Wizard | `handleComplete()` line 2003, SetupWizard exercise list rendering | code-verified |
| Core combo rotation by block number: `((currentBlock - 1) % 4) + 1` | `CoreFinisher` line 1657 | code-verified |

### Cardio System (code-verified)

| Feature | Location | Status |
|---|---|---|
| 5 rounds × (2:00 Zone A + 2:00 Zone B + 1:00 Zone C) = 25 minutes total | `CardioWorkout` line 1338 | code-verified |
| Zone-colored fill animation rising from bottom of screen | CardioWorkout render, line 1471 | code-verified |
| Equipment selection (6 presets + custom) on summary screen | Line 1445 | code-verified |
| Zone metric input (level/speed per zone) on summary screen | Line 1457 | code-verified |
| Last-session target display during active cardio | Line 1530 | code-verified |
| Early exit: "Finish Cardio & Log" button appears when paused with elapsed > 0 | `handleFinishEarly` line 1434, button line 1561 | code-verified |
| Cardio → Core pipeline: completing cardio stores `pendingCardio` then routes to CoreFinisher; both saved as single CARDIO+CORE history entry | Screen routing lines 2042, 2046 | code-verified |

### Core Stability (code-verified)

| Feature | Location | Status |
|---|---|---|
| 10-minute countdown timer (elapsed starts at 600) | `CoreFinisher` line 1577 | code-verified |
| 4 exercises in 2×2 grid from `CORE_COMBOS` (lines 64–88) | Line 1703 | code-verified |
| Round auto-increments when all 4 tapped (380ms commit delay) | `toggleEx` line 1625 | code-verified |
| Save enabled when timer expires or paused with rounds > 0 | `canSaveCoreSession` line 1652 | code-verified |

### Infrastructure (code-verified)

| Feature | Location | Status |
|---|---|---|
| Dark/light theme toggle | `COLORS` lines 91–93 | code-verified |
| Web Audio API beep engine with queue and iOS gesture-based unlock | Lines 227–292 | code-verified |
| `playTransitionThud()` (350 Hz, vol 0.1, 0.4s) at transitions | Line 290 | code-verified |
| Haptics via Capacitor + web vibrate fallback | `lib/native.js` line 52 | code-verified |
| Screen wake lock via KeepAwake + WakeLock API fallback | `lib/native.js` line 71, hook line 302 | code-verified |
| JSON backup export (Filesystem + Share on iOS, Blob download on web) | `lib/native.js` line 100 | code-verified |
| JSON backup import with validation | SettingsScreen | code-verified |
| Full reset with confirmation | SettingsScreen | code-verified |
| Debounced auto-persist (200ms) on every `db` change | Line 1961 | code-verified |
| `normalizeDb()` migration layer: safely merges any saved data with current defaults | Line 140 | code-verified |
| Bottom navigation (Today / History / Settings) | `BottomNav` line 370 | code-verified |

### Completed UX/UI Polish (code-verified)

- Progression terminology: REDUCE RESISTANCE / KEEP RESISTANCE / INCREASE RESISTANCE (lines 217–220)
- Progression logic uses chronological `findIndex()` (no `.reverse()`) (line 214)
- Passive AudioContext arming via `void safeResumeAudio()` in swipe `handleEnd()`
- Beep volumes: strength rest 0.11 (line 1075), cardio zone 0.11 (line 1406), core countdown 0.11 (line 1596), core round 0.12 (line 1628)
- Rest hint copy: "Fail 2–3 = reduce resistance" / "Fail 4–5 = keep resistance" (lines 1108–1109)
- Durable exercise name snapshot: `exerciseNames` map saved at finalize time in `buildStrengthPayload()` (line 1133)
- History name rendering: 3-tier resolution (snapshot → `db.plan` fallback → omit) (lines 1827–1829)
- Hub CTA: filled `themeObj.primary` background, white text (line 713)

---

## 4. Current User Flows

### First Launch
`WELCOME` → "Engage Protocol" → `SETUP` (10-step picker: 5 upper + 5 lower) → `HUB`
- `officialStarted` set to true
- `onboarded` set to true
- Exercise plan saved to `db.plan`
- 42 slots generated

### Returning Launch
Hydrate from Preferences → `getInitialScreen()` (line 206):
- If `pendingBlockReview` → `BLOCK_REVIEW`
- If `!onboarded && officialStarted` → `SETUP` (block restart)
- If `!onboarded && !officialStarted` → `WELCOME` (first time)
- Else → `HUB`

### Official Strength Workout
`HUB` → tap Active Protocol card → `STRENGTH` → swipe through 5 cycles → auto 2:00 rest between cycles → ease rating for perfect exercises → Finalize → `handleComplete()` saves entry → `HUB`
- Slot type (UPPER/LOWER) auto-detected from `db.slots[db.currentSlotIndex]`
- `pastWorkout` lookup filters by `h.official !== false` (line 1039)
- Saved: `{ kind: 'STRENGTH', slotType, elapsed, workoutLogs, exerciseNames, exerciseEaseRatings, totalSets, completedSets }`

### Official Cardio + Core
`HUB` → Active Protocol (CARDIO slot) → `CARDIO` timer → summary (equipment + zone levels) → Confirm Stats → `pendingCardio` stored → `CORE` finisher → Save Core → combined `CARDIO+CORE` entry → `HUB`
- Saved: `{ kind: 'CARDIO+CORE', cardio: { elapsed, equipment, metrics }, core: { rounds } }`

### Manual Sessions (Training Modules grid)
`HUB` → tap Upper/Lower/Cardio/Stability card → workout screen → complete → saved with `official: false`, `block: null`, `slotIndex: -1`
- Does NOT increment `workoutsCompletedInBlock` or advance `currentSlotIndex`
- Does NOT influence official progression advice

### Manual Core without Preceding Cardio
`HUB` → Stability module → `MANUAL_CORE` → CoreFinisher → Save → standalone `CORE` entry (when `pendingCardio` is null, line 2048)

### Block Completion
36th non-REST official workout → `BLOCK_REVIEW` screen → "Start Block N+1" → plan cleared, `onboarded: false` → `SETUP` wizard (line 2060)

### Off Day
`HUB` (OFF slot active) → "Confirm Recovery" → REST entry saved → slot advances → `HUB`
- REST entries do NOT increment `workoutsCompletedInBlock` (line 1998)

### History
`HUB` → bottom nav "History" → `HISTORY` → reverse-chronological log of all entries

### Settings
`HUB` → bottom nav "Settings" → `SETTINGS` → appearance toggle, beeps toggle, haptics toggle, backup export, backup restore, reset all data

---

## 5. Current Data Model

### Global State Shape (key: `myobound_db`)

```
{
  dbVersion: 2,
  onboarded: boolean,
  officialStarted: boolean,
  pendingBlockReview: boolean,
  currentBlock: number (1+),
  currentSlotIndex: number (0–41),
  workoutsCompletedInBlock: number (0–36),
  plan: {
    upper: [{ id, name, sets: 5, reps: '10' }, ...],  // 5 exercises
    lower: [{ id, name, sets: 5, reps: '10' }, ...]   // 5 exercises
  },
  usedInLastBlock: string[],  // exercise names from previous block
  slots: [{ type: 'UPPER'|'LOWER'|'CARDIO'|'OFF', week: 1–6, day: 1–7 }, ...],  // 42 slots
  history: [ ...history entries, newest first... ],
  coreProgram: {              // ⚠️ DEAD SCHEMA — stored/migrated but never read by UI
    mode: 'auto',             // always 'auto'; manual mode UI not built
    selectedComboId: null,    // always null; active combo derived from block number
    customByCombo: { combo1: {}, combo2: {}, combo3: {}, combo4: {} }
  },
  settings: {
    theme: 'dark' | 'light',
    haptics: boolean,
    beeps: boolean,
    audioUnlocked: boolean    // also dual-persisted under separate AUDIO_UNLOCK_KEY
  }
}
```

### History Entry Kinds

```
// Every entry wrapper:
{ date: ISO, block: number|null, slotIndex: number, official: boolean, data: {...} }

// STRENGTH (official or manual):
data: {
  kind: 'STRENGTH',
  slotType: 'UPPER' | 'LOWER',
  elapsed: seconds,
  workoutLogs: { [exerciseId]: [{ status: 'success'|'limit', reps: number, weight }] },
  exerciseNames: { [exerciseId]: string },       // durable snapshot
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

// CORE (standalone, manual only):
data: { kind: 'CORE', core: { rounds: number } }

// REST (official only):
data: { kind: 'REST' }
```

**Note on standalone CARDIO kind:** `CardioWorkout.onComplete` (line 1464) emits `{ kind: 'CARDIO', cardio: {...} }`, but all current routing intercepts it as `pendingCardio` and combines it with core into CARDIO+CORE. No code path saves a standalone CARDIO entry to history. However, `HubScreen` (line 568) defensively checks for `kind === 'CARDIO'`, suggesting the code anticipates legacy or edge-case data.

### Exercise ID Patterns
- Curated: `{lane}_{categoryKey}_{slugified_name}` (e.g., `upper_chest_dumbbell_flat_bench_press`)
- Custom: `custom_{timestamp}_{random}` (e.g., `custom_1741234567890_42`)

### Backward Compatibility
`normalizeDb()` (line 140) handles arbitrary input gracefully. It calculates `workoutsCompletedInBlock` from history if the field is missing (pre-Item-1 migration). It merges saved settings with defaults. It never crashes on malformed data.

### Dead Schema
`coreProgram.mode`, `coreProgram.selectedComboId`, and `coreProgram.customByCombo` are stored, normalized during migration, but never read or written by any UI component. Active combo is always derived from `db.currentBlock`.

---

## 6. Current UX/UI State

### Visual System
- Dark default: pure black `#000000` bg, `#1C1C1E` cards, `#0A84FF` primary
- Light: `#F2F2F7` bg, `#FFFFFF` cards, `#007AFF` primary
- Accent colors: success `#00FF87`, danger `#FF0055`, seafoam `#4FD1C5`/`#38B2AC`
- Cardio zones: A = `#00FF87`, B = `#FFD700`, C = `#FF0055`
- Typography: heavy use of `font-black`, `tracking-tighter`, uppercase labels
- Corners: rounded-xl to rounded-3xl (18–24px)
- Glassmorphism headers with `backdrop-blur-xl`
- Decorative gradient blobs on Hub and module cards
- Flip-clock animation for all countdown timers (`RestFlipDigits`)

### Component Inventory (all in `app/page.jsx`)

| Component | Line | Purpose |
|---|---|---|
| `Card` | 333 | Reusable rounded card |
| `Button` | 347 | primary/secondary/danger; calls `safeResumeAudio()` on click |
| `BottomNav` | 370 | Today/History/Settings tab bar |
| `WakeLockNotice` | 408 | Subtle notice when wake lock unsupported |
| `WelcomeScreen` | 423 | Animated landing with Zap icon |
| `SetupWizard` | 443 | 10-step exercise picker |
| `HubScreen` | 557 | Hero card + 4 module cards + progress bar |
| `SwipeableExerciseRow` | 766 | Swipe gesture, weight input, progression advice |
| `RestFlipDigits` | 966 | Flip-clock digit animation for all timers |
| `StrengthWorkout` | 1020 | Orchestrates exercises, rest, ease rating, finalization |
| `CardioWorkout` | 1338 | Zone timer, visual fill, summary, early exit |
| `CoreFinisher` | 1576 | 10-min countdown + 4-exercise grid + rounds |
| `HistoryScreen` | 1796 | Reverse-chronological log with name resolution |
| `SettingsScreen` | 1854 | Toggles, backup/restore, reset |
| Block Review | 2053 | Inline in `render()` switch |
| Off/Rest Day | 2110 | Inline in `render()` switch |

### Friction Points Still Present
- All audio cues are identical sine-wave beeps (no variety across contexts)
- `window.confirm()` / `window.alert()` used for destructive actions (not themed)
- "Reset All Data" button lacks visual separation from other settings controls
- Core combo label not displayed in CoreFinisher header (active combo is computed but not shown)
- Cardio equipment resets to 'Treadmill' every session (not persisted)

---

## 7. Highest-Priority Remaining Work

### Observable from Current Code

1. **Show active core combo label in CoreFinisher header**
   - Why: User cannot see which combo they are doing
   - Location: `CoreFinisher` header area (line 1664), `activeComboId` computed at line 1657
   - Classification: UX
   - Risk: Low
   - Direction: Display `activeComboId` name near "Stability" header text

2. **Persist cardio equipment choice**
   - Why: Equipment resets to 'Treadmill' every session, frustrating for non-treadmill users
   - Location: `CardioWorkout` (line 1342), no persistence mechanism
   - Classification: UX / logic
   - Risk: Low
   - Direction: Save last equipment to db.settings or a dedicated field, restore on mount

3. **Separate "Reset All Data" button visually**
   - Why: Destructive action sits adjacent to non-destructive controls with minimal separation
   - Location: `SettingsScreen`, near end of component
   - Classification: UI
   - Risk: Very low
   - Direction: Add section divider, warning zone background, or larger spacing

4. **Dead schema cleanup (`coreProgram`)**
   - Why: `mode`, `selectedComboId`, `customByCombo` are stored/migrated but never read
   - Location: `createDefaultCoreProgram()` line 108, `normalizeDb()` lines 185–194
   - Classification: cleanup
   - Risk: Low (but must ensure removal doesn't break `normalizeDb()` for existing data)
   - Direction: Remove schema fields or document them as reserved for future use

5. **Sound design variety**
   - Why: All countdown beeps across all workout types sound identical (similar Hz/vol/duration)
   - Location: `playBeep()` calls scattered across StrengthWorkout, CardioWorkout, CoreFinisher
   - Classification: UX
   - Risk: Low
   - Direction: Differentiate beep patterns per context (ascending pitch, multi-tone, etc.)

### Deferred Items (from README)

- Structured deload protocol (5/25 Master Guide references deloads; not enforced in app)
- Multi-block progression history or long-term periodization tracking
- Server-side backup or cloud sync
- Automated testing suite

---

## 8. Things That Must Not Be Broken

1. **36-workout block model** — Block completes at 36 non-REST workouts (line 2002), not 42 calendar slots. OFF/REST days advance `currentSlotIndex` but do not increment `workoutsCompletedInBlock` (line 1998: `workoutIncrement` is 0 for REST).

2. **5-cycle strength structure** — Cycle advances only when ALL exercises have completed the current cycle (`currentCycleFloor` = `Math.min(...)` across exercises, line 1048). Rest timer (2:00) triggers between cycles, not between exercises (line 1059).

3. **Progression logic in `getAdviceForExercise()`** — Uses chronological `findIndex()` (line 214). First limit in cycles 1–3 → REDUCE RESISTANCE, cycles 4–5 → KEEP RESISTANCE, no limits + ease "easy" → INCREASE RESISTANCE, else KEEP RESISTANCE.

4. **`normalizeDb()` migration safety** — Must produce valid state from any input (lines 140–204). Never crashes on malformed data. Merges with `createDefaultState()` defaults.

5. **Forced re-selection on block transition** — `handleStartNextBlock()` (line 2060) clears `plan`, sets `onboarded: false`, routes to SETUP. `usedInLastBlock` prevents re-picking.

6. **Manual session exclusion** — Manual sessions stored with `official: false`. Official `pastWorkout` lookup filters by `h.official !== false` (line 1039). Manual sessions must not influence official progression advice.

7. **Core combo rotation** — `((currentBlock - 1) % 4) + 1` (line 1657). Must stay in sync with block number.

8. **Swipe gesture integrity** — `SWIPE_THRESHOLD = 90` (line inside SwipeableExerciseRow). Vertical/horizontal disambiguation prevents accidental set logging during scroll.

9. **Durable exercise name snapshot** — `buildStrengthPayload()` saves `exerciseNames` (line 1133). History rendering uses 3-tier: snapshot → `db.plan` fallback → graceful omission (lines 1827–1829).

10. **AudioContext iOS lifecycle** — `safeResumeAudio()` called during user gestures: swipe end, `Button` onClick (line 347 area), cardio play/pause (line 1543), core start (line 1749).

---

## 9. Known Technical Debt

### Dead Schema
| Item | Location | Notes |
|---|---|---|
| `coreProgram` fields | `createDefaultCoreProgram()` line 108, `normalizeDb()` lines 185–194 | `mode`, `selectedComboId`, `customByCombo` stored/migrated but never read by UI. Active combo derived from block number. |

### Build Quirks
| Item | Notes |
|---|---|
| CocoaPods Ruby 4.0 UTF-8 | `pod install` may fail with `Encoding::CompatibilityError` on Ruby 4.0 systems. Workaround: `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --project-directory=ios/App` |

### Lack of Tests
No test files exist in the repository. Zero automated test coverage.

### Intentional Suppressions
| Item | Location | Notes |
|---|---|---|
| `eslint-disable-next-line react-hooks/exhaustive-deps` | Lines 1066, 1087, 1424, 1608 | 4 timer effects. Intentional: timer callbacks reference stale closures by design. |

### Stale Documentation
| Item | Location | Notes |
|---|---|---|
| README "Current App Scope" section | README.md lines 39–42 | States the app is "a foundation shell focused on native integration and iOS pipeline verification" and "the next step is migrating your full workout UI/logic." This is stale — the full workout UI/logic has been built. |

### Other Debt
| Item | Location | Notes |
|---|---|---|
| `window.confirm()` / `alert()` | Multiple locations (StrengthWorkout handleHomePress, SettingsScreen reset) | Native browser dialogs, not themed to match app. |
| Cardio equipment not persisted | `CardioWorkout` line 1342 | Defaults to 'Treadmill' every session. |
| Dual audio-unlock persistence | `settings.audioUnlocked` + `myobound_audioUnlocked` key | Written inside main DB blob AND separately. Both merged on hydration. Works but is a non-obvious pattern. |

---

## 10. Repository Status

**Repository snapshot (as of 2026-03-12):**

| Property | Value |
|---|---|
| **Branch** | `main` |
| **Latest commit** | `c18fbaa6f5d421ced4afb1185a214528e7787cc4` |
| **Commit subject** | "Update project handoff to reflect Tier 1 cleanup" |
| **Working tree** | Modified (this documentation pass) |
| **Remote** | `origin` → `https://github.com/ExegeticalLabs/5_25_codex.git` |
| **Push state** | Prior to this documentation pass, all work committed and pushed to `origin/main`. |

**Build commands:**
```bash
npm run dev              # Next.js dev server (web preview)
npm run build            # Static export to /out
npm run cap:sync:ios     # Build + sync to iOS (may need LANG fix for pod install)
npm run cap:open:ios     # Open Xcode
```

**CocoaPods workaround (if `pod install` fails on Ruby 4.0):**
```bash
npm run build && npx cap sync ios --no-build
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --project-directory=ios/App
```

**Dependencies (from `package.json`):**
- Next.js 15.2+, React 19, Capacitor 7 (core, ios, cli)
- Capacitor plugins: Preferences, Haptics, KeepAwake, Filesystem, Share
- lucide-react 0.542+ (icons)
- Tailwind CSS 3.4, PostCSS, Autoprefixer

**`.gitignore` excludes:** `node_modules/`, `.next/`, `out/`, `.DS_Store`, `.env*`, `.claude/`

---

## 11. Best Re-Onboarding Prompt

> You are continuing development on **MyoBound**, an iOS workout app built with Next.js 15 + React 19 (static export) wrapped in Capacitor 7. The core application logic is concentrated in `app/page.jsx` (2,142 lines), with a native bridge in `lib/native.js` (132 lines) and supporting config/style files. There is no routing, no API, and no database — all state is a single JSON blob persisted via Capacitor Preferences under the key `myobound_db`.
>
> The app implements a 36-workout block training system: 5-cycle × 5-exercise strength sessions with swipe-to-complete gesture, zone-based cardio intervals (2:00 A / 2:00 B / 1:00 C × 5 rounds = 25 min), and timed core stability finishers (10-min countdown, 4 exercises per round). Progression advice (CALIBRATION / REDUCE RESISTANCE / KEEP RESISTANCE / INCREASE RESISTANCE) is driven by per-exercise ease ratings and limit-cycle detection in `getAdviceForExercise()`.
>
> **Read these first:** `AI_START_HERE.md` for orientation, `PROGRAM_DOCTRINE.md` for training rules, `PROJECT_HANDOFF.md` for full implementation status. Then read `app/page.jsx` in full before making any changes.
>
> **Critical constraint:** Do not change core 5/25 behavior. Do not refactor the architecture. Do not add major new features without explicit approval. All changes should be minimal, safe, and approved one at a time.
>
> **Next priorities:** Core combo label display, cardio equipment persistence, Reset button visual separation. See Section 7 of `PROJECT_HANDOFF.md` for the full list.

---

## 12. Executive Summary

MyoBound is a fully functional iOS workout app with a complete training system: 36-workout block model, 5-cycle strength sessions with swipe gestures and progressive overload advice, zone-based cardio intervals, and timed core stability finishers. The core application logic is concentrated in `app/page.jsx` (2,142 lines), with a Capacitor native bridge and standard config/style files supporting it.

Previous work completed a 5-item doctrine alignment pass, a 10-item UX/UI polish pass, and a Tier 1 housekeeping pass (dead code removal, README terminology fix). All work is committed and pushed.

**What matters most next:** The remaining Tier 2 UX/UI polish items (core combo label, equipment persistence, reset button separation) are the safest and most impactful next tasks. Dead schema cleanup and sound design are lower priority.

**What should not be touched carelessly:** The progression logic (`getAdviceForExercise()`), the block completion/transition flow (`handleComplete()` / `handleStartNextBlock()`), the `normalizeDb()` migration layer, and the swipe gesture threshold in `SwipeableExerciseRow`. These are stabilized, doctrine-critical paths.

**README stale section:** Lines 39–42 of `README.md` describe the app as "a foundation shell" with a next step of "migrating your full workout UI/logic." This is stale — the full workout system has been built.
