# AI Start Here

This file orients a new AI agent (or human operator) to the MyoBound project. Read this first, then follow the read order below.

---

## 1. Read Order

1. **`AI_START_HERE.md`** — this file (orientation, constraints, working rules)
2. **`PROJECT_HANDOFF.md`** — full implementation status, data model, user flows, remaining work, technical debt
3. **`PROGRAM_DOCTRINE.md`** — the 5/25 training method rules the app must preserve
4. **`app/page.jsx`** — the entire application (2,142 lines: all components, state, logic)
5. **`lib/native.js`** — Capacitor native bridge (132 lines: persistence, haptics, wake lock, export)
6. **`README.md`** — alignment history and build commands (note: lines 39–42 are stale)
7. **`capacitor.config.json`**, **`package.json`** — platform and dependency configuration

---

## 2. Project Reality

- **What the app is:** MyoBound is an iOS workout app implementing the 5/25 block-based training program. Strength, cardio, and core sessions with progression tracking.
- **Where the core logic is:** Everything is in `app/page.jsx`. All 16 components, all state management, all workout logic, all screen routing — one file.
- **Architecture:** Next.js 15 static export → Capacitor 7 iOS wrapper. No server, no API, no database, no router. Single JSON blob persisted via Capacitor Preferences.
- **Project posture:** This is a **preserve-and-polish** project. The core training system is complete and aligned to doctrine. The work ahead is UX polish, cleanup, and quality-of-life improvements. Do not refactor the architecture unless explicitly asked.

---

## 3. Source-of-Truth Rules

| Situation | Trust |
|---|---|
| Code vs. README | **Trust code.** README lines 39–42 are stale (describe app as "foundation shell"). |
| Code vs. PROGRAM_DOCTRINE.md | For **training rules**, trust `PROGRAM_DOCTRINE.md`. For **what the app currently does**, trust code. If they conflict, state the mismatch — do not silently reconcile. |
| Code vs. PROJECT_HANDOFF.md | Trust code for behavior. Trust handoff for context and priorities. If line numbers have drifted, verify against the file. |
| Uncertain claims | Mark them as uncertain. Do not present inferences as verified facts. |
| Prior conversation memory | Do not trust it. Verify everything against current files. |

---

## 4. Working Rules for Future AI Agents

1. **Inspect current code before proposing changes.** Read the relevant section of `app/page.jsx` before editing it. Do not work from memory or summaries.
2. **Do not summarize from memory.** If you need to know what a function does, read it.
3. **Make the smallest safe change.** One concern per edit. Verify before moving to the next.
4. **Do not refactor architecture unless explicitly asked.** The single-file structure is intentional for this project stage.
5. **Separate doctrine issues from UI issues.** A doctrine violation (e.g., wrong progression logic) is a different severity than a UI issue (e.g., button spacing). Treat them differently.
6. **Preserve stabilized behavior.** The 10 items in Section 8 of `PROJECT_HANDOFF.md` are stabilized. Verify you are not breaking them before any edit.
7. **State what is verified vs. inferred.** If you haven't read the code to confirm something, say so.
8. **Use grep to verify before deleting.** Before removing any function, component, or constant, grep the entire codebase to confirm zero call sites.
9. **Do not change core 5/25 behavior without explicit approval.** This includes progression logic, block model, cycle structure, and combo rotation.
10. **After code changes, offer to run the full sync cycle:** `npm run build` → `npx cap sync ios` (with CocoaPods workaround if needed) → `npx cap open ios`.

---

## 5. High-Risk Areas

These are the parts of the codebase most likely to be broken by careless edits:

1. **`getAdviceForExercise()` (line 212)** — Progression logic. Uses chronological `findIndex()`, not `.reverse()`. Any change to limit detection, ease rating handling, or manual-session filtering can silently corrupt advice.

2. **`handleComplete()` (line 1981)** — Workout completion handler. Manages history entry creation, slot advancement, workout counting, and block completion trigger. Touching this affects the entire training loop.

3. **`handleStartNextBlock()` (line 2060)** — Block transition. Clears plan, resets counters, sets `onboarded: false`. Breaking this breaks the block cycle.

4. **`normalizeDb()` (line 140)** — Data migration layer. Must safely handle any input shape. Breaking this can corrupt user data on app launch.

5. **`SwipeableExerciseRow` swipe logic (line 766)** — The 90px threshold and vertical/horizontal disambiguation prevent accidental set logging. Changing these constants affects every strength workout.

6. **`buildStrengthPayload()` (line 1123)** — Creates the history entry for strength workouts. The `exerciseNames` snapshot pattern must be preserved or history rendering breaks.

7. **Screen routing in `render()` (line 2027)** — The `pendingCardio` flow (cardio → core → combined entry) is delicate. Changing routing without understanding the flow can lose workout data.

---

## 6. Safe Next Priority Types

The following task types are safest and most appropriate for the current project state:

- **UI polish:** Visual adjustments, spacing, typography, section dividers (low risk)
- **Display-only features:** Showing data that is already computed but not displayed (e.g., core combo label)
- **Persistence of user preferences:** Saving choices like cardio equipment (low risk, additive)
- **Dead code/schema removal:** After grep-confirming zero usage (low risk with verification)
- **Documentation updates:** Keeping handoff, doctrine, and README in sync with code changes
- **Build/sync verification:** Running the full build → sync → Xcode cycle after changes

---

## 7. Things to Avoid

- **Do not refactor `app/page.jsx` into multiple files** unless explicitly asked. The single-file architecture is a deliberate choice at this project stage.
- **Do not add new npm dependencies** without explicit approval.
- **Do not change progression logic** without understanding the full flow from `getAdviceForExercise()` through `buildStrengthPayload()` through `handleComplete()`.
- **Do not change `normalizeDb()`** without verifying backward compatibility with every possible saved state shape.
- **Do not assume README is current.** Lines 39–42 are stale. The "Alignment Completed" section (lines 44+) is current.
- **Do not add features from the "Deferred Items" list** (deload protocol, cloud sync, multi-block periodization) without explicit approval.
- **Do not treat the `coreProgram` schema as active.** It is dead schema. Do not build UI that reads from it without first discussing whether to use it or remove it.
- **Do not commit without being asked.** Do not push without being asked.
- **Do not skip the CocoaPods workaround.** If `pod install` fails with a UTF-8 error, use: `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --project-directory=ios/App`

---

## 8. One-Paragraph Re-Onboarding Prompt

MyoBound is an iOS workout app (Next.js 15 static export + Capacitor 7) with all logic in `app/page.jsx` (2,142 lines) and a native bridge in `lib/native.js` (132 lines). It implements the 5/25 training method: 36-workout blocks, 5-cycle × 5-exercise strength sessions with swipe gestures, zone-based cardio (2:00 A / 2:00 B / 1:00 C × 5 rounds = 25 min), and 10-minute core finishers with 4-combo rotation by block. Progression advice (CALIBRATION / REDUCE / KEEP / INCREASE RESISTANCE) uses chronological first-limit detection and per-exercise ease ratings. The core training system is complete and doctrine-aligned. Read `AI_START_HERE.md` first, then `PROJECT_HANDOFF.md`, then `PROGRAM_DOCTRINE.md`, then the code. Do not refactor architecture, do not change 5/25 behavior, and make the smallest safe change. Next priorities: core combo label display, cardio equipment persistence, reset button separation.
