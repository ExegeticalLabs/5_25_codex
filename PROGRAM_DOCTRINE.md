# 5/25 Program Doctrine

**Source basis:** This document extracts doctrine from the alignment section of `README.md` (Items 1–5, verified against the external 5/25 Master Guide on 2026-03-11), from the training rules encoded in `app/page.jsx`, and from the `CORE_COMBOS` data structure. The 5/25 Master Guide itself is an external document not stored in this repository. Where a doctrine point rests solely on implementation code rather than an explicit external rule, it is marked as **[inferred from implementation]**.

---

## 1. Purpose of the Method

The 5/25 method is a structured, block-based training program that cycles the trainee through strength (upper body and lower body), cardiovascular conditioning, and core stability work on a fixed weekly rhythm. Each block spans 36 counted workouts across a 6-week calendar window. The intent is progressive overload within a block, forced exercise variety between blocks, and structured recovery.

The method does not prescribe periodization across multiple blocks. Each block is self-contained: the trainee selects exercises, calibrates resistance, progresses or holds within the block, and then re-selects for the next block.

**Uncertain area:** The 5/25 Master Guide references deload weeks, but no deload protocol is enforced in the current implementation. Whether deloads are a hard doctrine requirement or an optional recommendation is unresolved.

---

## 2. Block Structure

- A **block** is a training cycle of **36 counted workouts** spread across a **6-week calendar** of 42 slots.
- Each week contains 6 training days and 1 off day, producing 42 calendar slots per block.
- Of those 42 slots, **6 are OFF days** (1 per week). OFF/REST entries advance the calendar position but do **not** count toward the 36-workout total.
- The block ends when the 36th non-REST official workout is completed. This triggers a Block Review screen.
- A new block begins only after the user explicitly starts it. Starting a new block clears the exercise plan, forces exercise re-selection, and resets the workout counter to 0.

**Explicit doctrine:** Block length is 36 workouts, not 42 calendar days. (README Item 1)

---

## 3. Weekly Training Rhythm

The 6-week block alternates between two weekly patterns:

**Week A** (weeks 1, 3, 5):
| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
| UPPER | CARDIO | LOWER | CARDIO | UPPER | CARDIO | OFF |

**Week B** (weeks 2, 4, 6):
| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
| LOWER | CARDIO | UPPER | CARDIO | LOWER | CARDIO | OFF |

**What is fixed:**
- 3 cardio sessions per week
- 1 off day per week (always day 7)
- 6 training days per week

**What rotates:**
- The placement of UPPER and LOWER alternates between Week A and Week B, ensuring balanced exposure across the block.

**Per block totals:** 9 UPPER sessions + 9 LOWER sessions + 18 CARDIO sessions = 36 counted workouts + 6 OFF days = 42 calendar slots.

**Off days:** The doctrine treats off days as recovery. They advance the schedule but do not count as workouts.

---

## 4. Strength Training Doctrine

### Exercise Selection Model

Each strength session uses **5 exercises**, one from each of 5 prescribed muscle-group categories:

**Upper (5 categories):** Chest, Back, Shoulders, Biceps, Triceps
**Lower (5 categories):** Quads (primary), Hamstrings/Hinge, Glutes/Accessory, Calves, Quads (different variation)

The trainee selects one exercise per category at the start of each block. These selections remain fixed for the entire block. At block transition, the trainee must re-select, and is encouraged to choose different movements for the same target muscles ("same target, different movement").

Curated exercise lists are provided for each category, plus a "User Choice" custom-entry option.

### 5-Cycle Structure

Each strength workout consists of **5 cycles**. In each cycle, the trainee performs one set of each of the 5 exercises. A cycle advances only when **all 5 exercises** have completed their set for that cycle.

This means:
- Cycle 1: Exercise A set 1, Exercise B set 1, Exercise C set 1, Exercise D set 1, Exercise E set 1
- Cycle 2: All exercises set 2
- ...through Cycle 5

Total: 25 sets per workout (5 exercises × 5 cycles).

### Set and Repetition Doctrine

- **Target reps per set:** 10
- A set is logged as **success** if the trainee completes all 10 reps with proper form and tempo.
- A set is logged as **limit** if the trainee reaches failure before 10 reps (valid range: 5–9 reps achieved).

### Tempo Doctrine

**Explicit doctrine (from in-app guidance):** "Move 2 seconds up, 2 seconds down."

This is a controlled, deliberate tempo. Rushing tempo is explicitly listed as a form of failure.

### Failure Definition

**Explicit doctrine (from in-app limit prompt):** "Failure = breaking form, rushing tempo, shortening range, or not hitting 10 reps."

Failure is not merely inability to move the weight. It encompasses any degradation of execution quality.

### Range-of-Motion Doctrine

Full range of motion is implied as a doctrine requirement. Shortening range is listed as a failure criterion.

### How Resistance Should Progress

See Section 5 (Progression Doctrine) for the full progression system.

### Early vs. Late Failure Interpretation

- **Early failure** (limit reached in cycles 1–3): The resistance is too heavy. Next session recommendation: **REDUCE RESISTANCE**.
- **Late failure** (limit reached in cycles 4–5): The resistance is at the right challenge level. Next session recommendation: **KEEP RESISTANCE**.
- **No failure + exercise marked "challenging":** Stay at current resistance. Recommendation: **KEEP RESISTANCE**.
- **No failure + exercise marked "easy":** Ready to increase. Recommendation: **INCREASE RESISTANCE**.

### Rest Between Cycles

**[Inferred from implementation]:** 2 minutes (120 seconds) of rest between cycles. The rest timer is mandatory between cycles but can be skipped manually.

---

## 5. Progression Doctrine

### Calibration

The first time an exercise is performed (no prior history for that exercise in the current plan), the advice is **CALIBRATION**. The trainee should use a conservative weight to establish a baseline.

### Early Failure vs. Late Failure

- Limit reached in **cycle 1, 2, or 3** → **REDUCE RESISTANCE** next session
- Limit reached in **cycle 4 or 5** → **KEEP RESISTANCE** next session

The system checks for the **first** limit occurrence in chronological cycle order (cycle 1 through 5). It does not use the last or worst failure—it uses the earliest.

### Perfect-Session Outcomes

A "perfect" exercise performance means: all 5 cycles completed with success (10 reps), no limits hit. For perfect exercises, the trainee is prompted to rate each exercise as **"easy"** or **"challenging"** at finalize time.

- All success + rated **"challenging"** → **KEEP RESISTANCE**
- All success + rated **"easy"** → **INCREASE RESISTANCE**

The default rating for a perfect exercise is "challenging" (conservative). The trainee must actively toggle to "easy" for the system to recommend an increase.

### What Should Remain Stable vs. What Should Increase/Decrease

- **Tempo, form, and range of motion** should remain stable at all times.
- **Resistance/weight** is the only variable that should change between sessions, based on the progression advice.
- **Rep target** (10) is fixed and does not change.
- **Set count** (5 cycles of 5 exercises) is fixed.

---

## 6. Cardio Doctrine

### Total Duration

25 minutes per official cardio session (5 rounds × 5 minutes per round).

### Zone Structure

Each round is divided into three intensity zones:

| Zone | Duration | Intent |
|------|----------|--------|
| Zone A | 2:00 | Steady state |
| Zone B | 2:00 | Build / moderate push |
| Zone C | 1:00 | Hard final minute |

### Round Structure

5 rounds of the A-B-C pattern, for a total of 25 minutes. The zones repeat identically across all 5 rounds.

### What Metrics Matter

The trainee records a level or speed metric for each zone (A, B, C) at the end of the session. The previous session's zone metrics are displayed during the workout as targets.

**[Inferred from implementation]:** Equipment type is also recorded (6 presets + custom).

### How Cardio Connects to Core

In the official flow, cardio is always followed by a core stability finisher. They are saved as a combined `CARDIO+CORE` history entry. Cardio cannot be saved independently in the official flow—it always routes to the core finisher upon completion.

---

## 7. Core Doctrine

### How Core Work Is Structured

Core work is a **10-minute timed finisher**. A countdown timer starts at 10:00 and runs to 0:00. During this time, the trainee performs rounds of 4 core exercises displayed in a 2×2 grid. Each round requires tapping all 4 exercises to mark them complete.

### Combo Rotation Across Blocks

There are **4 core combos**, each containing 4 exercises:

| Combo | Exercises |
|-------|-----------|
| Combo 1 | Dead Bug (10/side), RKC Plank (30 sec), Bird Dog (10/side), Side Plank (20 sec/side) |
| Combo 2 | Reverse Crunch (15), Hollow Hold (20 sec), Forearm Plank (30 sec), Plank Shoulder Taps (10/side) |
| Combo 3 | Sit-Up controlled (15), Reverse Crunch (15), High Plank (30 sec), Body Saw (10 controlled) |
| Combo 4 | Pallof Press (10/side), Side Plank (20 sec/side), Bird Dog (10/side), RKC Plank (30 sec) |

### What Is Fixed vs. Swappable

**Fixed:** The 4 combos and their contents are hardcoded. The rotation order (1→2→3→4→1...) is fixed.

**Swappable:** The `coreProgram` schema in the data model includes fields for `mode: 'manual'` and `customByCombo` overrides. However, **no UI exists to exercise these fields**. The combo is always auto-selected by block number. This is dead schema—the customization path was designed but never built.

### How the Rotation Repeats

Active combo is determined by: `((currentBlock - 1) % 4) + 1`

- Block 1 → Combo 1
- Block 2 → Combo 2
- Block 3 → Combo 3
- Block 4 → Combo 4
- Block 5 → Combo 1 (repeats)

(README Item 3)

---

## 8. Block Transition Doctrine

### What Must Happen at Block Rollover

1. The 36th non-REST official workout triggers Block Review.
2. Official workout logging is frozen until the user starts the next block.
3. The user views block completion stats and clicks "Start Block N+1."
4. The exercise plan is **completely cleared** (`plan: { upper: [], lower: [] }`).
5. The onboarded flag is set to false, routing the user back through the Setup Wizard.
6. The workout counter resets to 0. The slot index resets to 0. (Slots are not regenerated — they persist as the same fixed 42-slot pattern, which is identical every block.)
7. `usedInLastBlock` is populated with the exercise names from the just-completed block, so the Setup Wizard can flag (but not prevent) re-selection.

(README Item 2)

### Exercise Reselection Rules

The trainee **must** re-select all 10 exercises (5 upper + 5 lower) for the new block. The Setup Wizard shows exercises used in the previous block, encouraging variety.

### What "Same Target, Different Movement" Means

Each exercise category targets a specific muscle group (e.g., Chest, Back, Quads). The trainee should choose a **different exercise** from the same category's option list for the new block. The goal is movement variety while maintaining muscle-group consistency.

### Calibration Reset Expectations for a New Block

Because exercises are re-selected (and ideally changed), the progression system effectively resets. The first time a newly selected exercise appears, the advice will be **CALIBRATION** again. If the trainee re-selects the same exercise (despite the discouragement), their prior history will still be available and progression advice will continue from where it left off.

**[Inferred from implementation]:** The progression lookup searches all history (not just the current block) for the most recent official strength session of the same slot type (UPPER or LOWER). If the trainee re-selects the same exercise in a new block, the system will find that exercise's logs from the previous block's most recent session and base its advice on that single session — not an aggregate of all past sessions. This is a code reality, not necessarily an explicit doctrine choice.

---

## 9. Non-Negotiables

These rules must be preserved exactly in any implementation:

1. **36-workout block model.** Blocks complete at 36 non-REST official workouts, not 42 calendar slots.
2. **5 cycles × 5 exercises per strength session.** 25 total sets, cycle advances only when all exercises complete their current cycle.
3. **10-rep target.** Success = 10 reps, limit = 5–9 reps.
4. **Progression logic order:** first limit position determines advice (cycles 1–3 → REDUCE, 4–5 → KEEP), no limits + easy → INCREASE, default → KEEP.
5. **Forced exercise re-selection on block transition.** Plan must be cleared. User must go through Setup.
6. **Core combo rotation tied to block number.** `((currentBlock - 1) % 4) + 1`, 4 fixed combos.
7. **Week A/B alternation.** Odd weeks = UPPER start, even weeks = LOWER start.
8. **Manual sessions excluded from progression.** Manual sessions do not influence official progression advice.
9. **Tempo doctrine:** 2 seconds up, 2 seconds down.
10. **Failure definition:** Form break, tempo rush, range shortening, or not hitting 10 reps.

---

## 10. Acceptable Implementation Flexibility

These areas may vary without violating doctrine:

- **Wording and copy:** Button labels, screen titles, instructional text may be adjusted for clarity.
- **UI presentation:** Layout, colors, animations, card styles, font choices are presentation concerns.
- **Timer visuals:** How rest timers, cardio zone timers, and core countdown timers are displayed (flip digits, linear countdowns, circular progress, etc.).
- **History display details:** How workout history entries are formatted and what summary stats are shown.
- **Audio/haptic patterns:** Beep frequencies, volumes, haptic styles, and countdown patterns are UX polish, not doctrine.
- **Equipment list:** The specific cardio equipment presets may be adjusted.
- **Core exercise rep/time prescriptions:** The specific rep counts and hold durations within combos may be tuned.
- **Guidance text placement and content:** As long as tempo, failure definition, and form reminders are present somewhere accessible.
- **Block Review stats:** What summary statistics are shown at block completion.
- **Analytics and duration estimates:** How average session times and other stats are calculated and displayed.

---

## 11. Doctrine Drift Checklist

Use this checklist to spot doctrine drift during development:

### Block Model Drift
- [ ] Block still completes at exactly 36 non-REST workouts
- [ ] OFF/REST entries advance calendar but do not increment workout count
- [ ] Block Review triggers immediately on 36th workout
- [ ] Official workout logging freezes during Block Review
- [ ] Slot count is exactly 42 (6 weeks × 7 days)
- [ ] Week A/B alternation pattern is preserved

### Progression Drift
- [ ] CALIBRATION appears for exercises with no prior logs
- [ ] First limit in cycles 1–3 → REDUCE RESISTANCE
- [ ] First limit in cycles 4–5 → KEEP RESISTANCE
- [ ] No limits + "challenging" → KEEP RESISTANCE
- [ ] No limits + "easy" → INCREASE RESISTANCE
- [ ] Default ease rating is "challenging" (conservative default)
- [ ] Only perfect exercises (5/5 success) can be rated for ease
- [ ] Manual sessions excluded from progression lookups

### Strength Execution Drift
- [ ] 5 exercises per session (one per muscle-group category)
- [ ] 5 cycles per workout
- [ ] 10-rep target per set
- [ ] Cycle advances only when ALL exercises complete their current cycle
- [ ] Rest period occurs between cycles (not between exercises)
- [ ] Limit range is 5–9 reps (not arbitrary)
- [ ] Success is exactly 10 reps

### Cardio Drift
- [ ] 5 rounds per session
- [ ] Zone A = 2:00, Zone B = 2:00, Zone C = 1:00
- [ ] Total = 25 minutes
- [ ] Cardio always routes to Core in official flow
- [ ] Combined entry saved as CARDIO+CORE

### Core Drift
- [ ] 10-minute countdown timer
- [ ] 4 exercises per combo
- [ ] 4 combos in rotation
- [ ] Combo selection follows `((currentBlock - 1) % 4) + 1`
- [ ] Round increments when all 4 exercises are tapped

### Transition Drift
- [ ] Plan cleared on new block start
- [ ] User routed to Setup Wizard
- [ ] `usedInLastBlock` populated for re-selection awareness
- [ ] Workout counter and slot index reset to 0
- [ ] `onboarded` set to false

### User-Understanding Drift
- [ ] Tempo guidance (2 sec up, 2 sec down) is accessible in the app
- [ ] Failure definition is displayed during limit logging
- [ ] Form/ROM reminder appears during rest
- [ ] Progression terminology uses REDUCE/KEEP/INCREASE RESISTANCE (not LOAD)
- [ ] User can distinguish official vs. manual sessions

---

## 12. Executive Summary

**What the app must never violate:**
The 36-workout block model, the 5-cycle × 5-exercise strength structure, the chronological first-limit progression logic, forced exercise re-selection on block transition, and the core combo rotation tied to block number. These are structural doctrine rules that define what 5/25 is.

**What the app may vary safely:**
UI presentation, timer styling, audio/haptic patterns, copy/labels, equipment presets, history display format, analytics calculations, and guidance text phrasing. These are implementation presentation choices.

**The single biggest doctrine risk area:**
**Progression logic.** The `getAdviceForExercise()` function combines limit-cycle detection, ease ratings, and manual-session exclusion into a single decision path. Any change to how limits are detected (e.g., using `.reverse()` instead of `findIndex()`), how ease ratings are defaulted, or how manual sessions are filtered could silently corrupt progression advice without producing obvious errors. This logic must be treated as the most sensitive code in the application.
