# MyoBound iOS Foundation (Next.js + Capacitor)

This workspace is now configured for:

- Next.js static export (`output: 'export'`)
- Capacitor iOS wrapper (`com.aaronknudson.myobound`)
- Native-safe adapters for:
  - Preferences-backed persistence
  - Haptics
  - Keep-awake
  - Share-sheet JSON backup export

## Run Web

```bash
npm install
npm run dev
```

## Build + Sync iOS

```bash
npm run cap:sync:ios
```

## Open in Xcode

```bash
npm run cap:open:ios
```

Then in Xcode:

1. Select `App` target
2. Set Signing Team (Automatic signing)
3. Choose an iPhone device/simulator
4. Run

## Current App Scope

The current `app/page.jsx` is a foundation shell focused on native integration and iOS pipeline verification.
The next step is migrating your full workout UI/logic into this shell.

## Alignment Completed

Five-item alignment pass against the 5/25 Master Guide, completed 2026-03-11.

### Item 1 — 36-Workout Block Model

A block completes after 36 official strength/cardio workouts, not 42 calendar slots. OFF/REST entries advance `currentSlotIndex` for sequencing but do not increment `workoutsCompletedInBlock`. Block review triggers immediately on the 36th workout.

### Item 2 — Forced Exercise Re-Selection on New Block

Starting a new block clears the exercise plan, sets `onboarded: false`, and routes to SETUP. Users must re-select exercises for the new block. `officialStarted` distinguishes returning block-restart users from first-time users in `getInitialScreen()`.

### Item 3 — Core Combo Rotation by Block

Four official core combos rotate by block number: Block 1 = Combo 1, Block 2 = Combo 2, Block 3 = Combo 3, Block 4 = Combo 4, then repeat. Active combo derived via `((currentBlock - 1) % 4) + 1`.

### Item 4 — Minimal Beginner Guidance

Three targeted guidance placements, no row-level clutter:
1. **Onboarding card** in StrengthWorkout (Cycle 0 only): "Move 2 seconds up, 2 seconds down. Stop if form breaks or you can't reach 10 reps."
2. **Failure definition** in limit prompt: "Failure = breaking form, rushing tempo, shortening range, or not hitting 10 reps"
3. **Form reminder** in Cycle 1 rest hint: "Check form & ROM"

### Item 5 — Per-Exercise Easy/Challenging Load Progression

Perfect sessions (5 cycles, all success, no limits) default to KEEP LOAD unless the user marks the exercise as "felt easy" at finalize time. Ratings are collected per exercise, not per session. A compact toggle section appears above the Finalize button showing only qualifying exercises. Each defaults to "challenging"; tapping toggles to "easy." Stored in `data.exerciseEaseRatings` in the history entry. `getAdviceForExercise()` returns INCREASE LOAD only when `exerciseEaseRating === 'easy'`.

### Manual-Session Exclusion Rule

Official load advice (`pastWorkout` lookup) excludes manual strength sessions by filtering `h.official !== false`. Manual sessions are stored with `official: false`, `block: null`, `slotIndex: -1` and do not influence future official progression advice.

### Deferred Items (Not Yet Implemented)

- Structured deload protocol (spec references deload weeks; not yet enforced in app logic)
- Multi-block progression history or long-term periodization tracking
- Server-side backup or cloud sync
- Automated testing suite
