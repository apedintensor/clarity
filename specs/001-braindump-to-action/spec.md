# Feature Specification: Braindump to Action

**Feature Branch**: `001-braindump-to-action`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Build an app that helps break down goals/projects into actionable steps to overcome procrastination. Brain dump thoughts into a box, AI organizes and clarifies, breaks down into manageable tasks for flow states. Positive reinforcement throughout. Web dashboard + CLI interface."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Brain Dump Capture (Priority: P1)

A user feels overwhelmed by a goal or project. They open Clarity and dump all their thoughts, worries, ideas, and half-formed plans into a free-form input area. They type or paste everything on their mind without worrying about structure, grammar, or order. The system accepts the raw input and confirms it has been captured. The user immediately feels relief from cognitive load — their thoughts are now externalized and safe.

**Why this priority**: This is the entry point to the entire system. Without frictionless capture, nothing else works. Research on cognitive offloading shows that externalizing thoughts alone reduces stress and frees working memory. David Allen's GTD "mind sweep" confirms that capture must come first.

**Independent Test**: Can be fully tested by opening the app, typing unstructured text into the brain dump area, and confirming the content is saved and retrievable. Delivers immediate value: cognitive relief from externalizing thoughts.

**Acceptance Scenarios**:

1. **Given** a user on the dashboard, **When** they type unstructured text into the brain dump input and submit, **Then** the system saves all content and displays a confirmation that their thoughts have been captured.
2. **Given** a user with a saved brain dump, **When** they return to the dashboard later, **Then** they can view their previously captured brain dumps.
3. **Given** a user using the CLI, **When** they pipe text or pass text as an argument to the capture command, **Then** the system saves the content identically to the web interface.
4. **Given** a user mid-dump, **When** they add more text to an existing brain dump session, **Then** the new content is appended without losing previous entries.

---

### User Story 2 - AI-Powered Clarification & Organization (Priority: P2)

After capturing a brain dump, the user triggers AI processing. The system analyzes the raw thoughts, identifies themes, goals, and actionable items, and organizes them into coherent groups. The AI then asks up to 5 targeted clarification questions to resolve ambiguities — for example, "You mentioned 'launch the product' — what does launch mean to you? A beta release, a public announcement, or going live on an app store?" The user answers these questions in a conversational back-and-forth. After clarification, the system presents an organized summary: identified goals, grouped themes, and a clear picture of what the user actually wants to achieve, including their emotional "why" (purpose).

**Why this priority**: Organization and clarification transform raw thoughts into structured intent. This is where Tony Robbins' RPM framework applies — defining the Result and connecting to Purpose before jumping to action. Without this step, tasks lack direction and emotional motivation.

**Independent Test**: Can be tested by submitting a brain dump, receiving AI-generated clarification questions, answering them, and verifying the system produces an organized summary with identifiable goals, themes, and purpose statements.

**Acceptance Scenarios**:

1. **Given** a saved brain dump, **When** the user triggers AI processing, **Then** the system presents an organized view grouping related thoughts into themes and identifying potential goals.
2. **Given** an AI-organized summary, **When** ambiguities exist, **Then** the system asks up to 5 targeted clarification questions with suggested answer options.
3. **Given** clarification questions, **When** the user answers them, **Then** the system refines the organized summary to reflect the user's intent.
4. **Given** an organized summary, **When** the user reviews it, **Then** each goal includes a purpose statement explaining why it matters to the user.
5. **Given** a CLI session, **When** the user runs the clarify command, **Then** the system outputs questions and accepts answers via stdin/stdout in a conversational flow.

---

### User Story 3 - Task Breakdown & Action Plan (Priority: P3)

The user reviews their organized goals and triggers task breakdown. The system decomposes each goal into specific, actionable tasks sized for completion in a single focused session (25-90 minutes). Tasks are ordered by dependency and priority. Each task has a clear definition of "done." The system presents a Massive Action Plan — a prioritized sequence the user can follow without needing to think about what comes next. Tasks are chunked into manageable groups to prevent overwhelm.

**Why this priority**: This is where clarity becomes action. Task decomposition is one of the most effective procrastination interventions (research shows large effect sizes). Tony Robbins' chunking principle and the implementation intentions research both support breaking goals into specific, concrete next steps.

**Independent Test**: Can be tested by taking an organized goal, generating a task breakdown, and verifying each task is specific, time-bounded, has a clear "done" definition, and tasks are in a logical sequence.

**Acceptance Scenarios**:

1. **Given** an organized goal with purpose, **When** the user triggers task breakdown, **Then** the system generates a list of specific, actionable tasks ordered by dependency.
2. **Given** a generated task list, **When** the user views it, **Then** each task includes an estimated duration, a clear "done" definition, and its relationship to the parent goal.
3. **Given** a task list, **When** a task is too large (estimated over 90 minutes), **Then** the system automatically suggests splitting it into smaller sub-tasks.
4. **Given** a CLI session, **When** the user runs the breakdown command for a specific goal, **Then** the system outputs the task list in both human-readable and JSON formats.

---

### User Story 4 - Flow-State Task Execution (Priority: P4)

The user selects a task to work on and enters "focus mode." The system presents only the current task with its context — no other tasks, notifications, or distractions visible. A timer tracks the session. When the user completes the task, they mark it done and the system automatically presents the next task in sequence. The user stays in flow without needing to decide what to do next. Context switching is eliminated because the system manages the sequence.

**Why this priority**: Flow state research shows that context switching (even 5-second interruptions) triples error rates. By presenting one task at a time and automating the transition, the system protects the user's focus. This is where the productivity gain is realized.

**Independent Test**: Can be tested by entering focus mode on a task, completing it, and verifying the next task appears automatically without requiring navigation or decision-making.

**Acceptance Scenarios**:

1. **Given** a task list, **When** the user selects a task and enters focus mode, **Then** the interface shows only the current task, its context, its "done" definition, and a session timer.
2. **Given** focus mode, **When** the user marks the current task complete, **Then** the system immediately presents the next task in sequence without requiring navigation.
3. **Given** focus mode, **When** the user completes a task, **Then** the system displays a brief celebration moment (positive reinforcement) before showing the next task.
4. **Given** focus mode, **When** the user needs to pause, **Then** they can exit focus mode and resume later from where they left off.
5. **Given** a CLI session, **When** the user runs the focus command, **Then** the system displays the current task and accepts a "done" command to advance to the next task.

---

### User Story 5 - Progress & Positive Reinforcement (Priority: P5)

As the user completes tasks, the system provides continuous positive reinforcement. This includes visual progress indicators showing how far they've come toward their goal, celebration moments on task completion, milestone acknowledgments (e.g., "You've completed 50% of your launch plan!"), streak tracking for consecutive days of action, and encouraging messages grounded in achievement psychology. The dashboard shows an overview of all goals with their progress, completed tasks, and momentum indicators.

**Why this priority**: Behavioral psychology research confirms that immediate positive reinforcement strengthens habit formation. The dopamine loop from completion + celebration + next task creates sustainable motivation. Streaks leverage loss aversion. Progress bars trigger the goal-gradient effect (people try harder as they approach completion).

**Independent Test**: Can be tested by completing several tasks and verifying progress indicators update, celebration messages appear, streaks are tracked, and the dashboard accurately reflects overall progress.

**Acceptance Scenarios**:

1. **Given** a goal with tasks, **When** the user completes a task, **Then** the progress indicator for that goal updates immediately.
2. **Given** task completion, **When** the system displays reinforcement, **Then** it includes a celebration moment and an encouraging message that varies (not repetitive).
3. **Given** consecutive days of task completion, **When** the user views the dashboard, **Then** a streak counter shows their current streak and longest streak.
4. **Given** a milestone (25%, 50%, 75%, 100% of a goal), **When** reached, **Then** the system displays a special milestone celebration distinct from regular task completion.
5. **Given** the CLI, **When** the user runs the progress command, **Then** the system outputs goal progress, streak data, and recent completions in a formatted summary.

---

### Edge Cases

- What happens when a brain dump contains no actionable content (e.g., pure venting or journaling)? System MUST still save the content and inform the user that no goals were identified, offering to re-process or let the user manually identify goals.
- What happens when the AI cannot determine the user's intent after clarification? System MUST present its best interpretation and allow the user to manually edit the organized summary.
- What happens when a user abandons a goal midway? System MUST allow archiving without deleting, preserving all progress data.
- What happens when a user has multiple active goals? System MUST allow switching between goals while maintaining separate progress for each.
- What happens when the CLI and web dashboard are used for the same account? Data MUST be synchronized — changes in one interface reflect in the other.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a free-form text input area for capturing unstructured thoughts without character limits or formatting requirements.
- **FR-002**: System MUST persist all brain dumps with timestamps and allow users to retrieve them later.
- **FR-003**: System MUST analyze brain dump content using AI to identify themes, goals, and potential action items.
- **FR-004**: System MUST generate up to 5 targeted clarification questions when ambiguities are detected in the brain dump.
- **FR-005**: System MUST organize clarified content into goals, each with a purpose statement (the emotional "why").
- **FR-006**: System MUST decompose goals into specific, time-bounded tasks (25-90 minute sessions) with clear "done" definitions.
- **FR-007**: System MUST order tasks by dependency and priority within each goal.
- **FR-008**: System MUST provide a focus mode that displays only the current task and its context, eliminating all other visual distractions.
- **FR-009**: System MUST automatically advance to the next task upon completion without requiring user navigation.
- **FR-010**: System MUST track and display progress toward each goal as a percentage and visual indicator.
- **FR-011**: System MUST provide varied positive reinforcement messages upon task completion, avoiding repetitive phrases.
- **FR-012**: System MUST track daily streaks and display current and longest streak counts.
- **FR-013**: System MUST deliver milestone celebrations at 25%, 50%, 75%, and 100% goal completion.
- **FR-014**: System MUST provide a web dashboard for visual interaction with all features.
- **FR-015**: System MUST provide a CLI tool that exposes all core functionality (capture, clarify, breakdown, focus, progress) for use by humans and AI assistants.
- **FR-016**: System MUST synchronize data between web dashboard and CLI in real time.
- **FR-017**: System MUST allow users to manually edit AI-generated organizations, task breakdowns, and goal structures.
- **FR-018**: System MUST allow archiving of goals without permanent deletion.
- **FR-019**: CLI MUST support both human-readable and JSON output formats for all commands.

### Key Entities

- **Brain Dump**: A raw capture of unstructured user thoughts. Has a timestamp, raw text content, and processing status (raw, processing, organized). Belongs to a user. Can produce one or more Goals.
- **Goal**: A specific outcome the user wants to achieve, extracted from a brain dump. Has a title, purpose statement (the "why"), status (active, completed, archived), and progress percentage. Contains one or more Tasks. Belongs to a user.
- **Task**: A specific, actionable step toward completing a goal. Has a title, description, "done" definition, estimated duration (25-90 min), status (pending, in-progress, completed), sequence order, and dependency relationships. Belongs to a Goal.
- **Clarification**: A question-answer pair generated during the AI clarification process. Linked to a Brain Dump. Has a question, suggested answers, and the user's selected/provided answer.
- **Progress Record**: A daily record of user activity. Tracks tasks completed, goals advanced, and streak data. Used to calculate reinforcement triggers and milestone celebrations.
- **User**: The person using the system. Has preferences, active goals, brain dump history, and streak data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a brain dump capture in under 60 seconds from opening the app.
- **SC-002**: 80% of AI-generated clarification questions are rated "relevant" by users (the question addresses something the user actually needed to clarify).
- **SC-003**: Users go from brain dump to actionable task list in under 10 minutes for a typical goal.
- **SC-004**: 70% of generated tasks are completed without the user needing to manually edit the task description or "done" definition.
- **SC-005**: Users in focus mode complete 40% more tasks per session compared to working from a traditional task list.
- **SC-006**: 75% of users who complete their first goal return to create a second goal within 14 days.
- **SC-007**: Average daily streak length exceeds 5 consecutive days for active users.
- **SC-008**: All CLI commands produce output within 2 seconds for non-AI operations and within 30 seconds for AI-powered operations.
- **SC-009**: Data created via CLI is visible on the web dashboard within 5 seconds, and vice versa.

### Assumptions

- Users are individuals (not teams) managing personal goals and projects.
- The system uses a single AI provider for organization and clarification (standard LLM integration).
- Authentication uses standard email/password or OAuth for the web dashboard. CLI authenticates via API token.
- The app is primarily English-language at launch; internationalization is out of scope for this feature.
- Brain dumps are text-only at launch; image, voice, or file attachments are out of scope.
- The system stores data in a persistent database; offline-first functionality is out of scope.
