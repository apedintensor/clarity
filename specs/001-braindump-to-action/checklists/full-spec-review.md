# Full Spec Review Checklist: Braindump to Action

**Purpose**: Lightweight self-review of requirements quality across all 5 user stories, focusing on completeness gaps, clarity issues, and missing specifications.
**Created**: 2026-02-14
**Feature**: [spec.md](../spec.md)
**Depth**: Lightweight (~15 items)
**Audience**: Author (self-review)

## Requirement Completeness

- [ ] CHK001 - Are authentication requirements fully specified? The spec assumes "standard email/password or OAuth" [Spec §Assumptions] but no FR defines signup, login, session management, or token handling. [Gap]
- [ ] CHK002 - Are requirements defined for what happens when the AI provider is unavailable or returns errors? No FR addresses AI service failure modes. [Gap, Exception Flow]
- [ ] CHK003 - Are data retention and deletion requirements specified? FR-018 covers archiving goals but no requirement addresses brain dump deletion, account deletion, or data export. [Gap]

## Requirement Clarity

- [ ] CHK004 - Is "real time" synchronization in FR-016 quantified? SC-009 says "within 5 seconds" but FR-016 says "in real time" — are these consistent or conflicting? [Ambiguity, Spec §FR-016 vs §SC-009]
- [ ] CHK005 - Is "varied positive reinforcement" in FR-011 defined with measurable criteria? How many unique messages constitute "varied"? What is the minimum before repetition is acceptable? [Clarity, Spec §FR-011]
- [ ] CHK006 - Is "all other visual distractions" in FR-008 defined? Does focus mode hide browser chrome, OS notifications, or only in-app elements? [Ambiguity, Spec §FR-008]

## Scenario Coverage

- [ ] CHK007 - Are requirements defined for concurrent AI processing? What happens if a user triggers processing on one brain dump while another is still being processed? [Gap, Alternate Flow]
- [ ] CHK008 - Are requirements specified for task dependency failures? What happens in focus mode when the next task has unmet dependencies (predecessor not completed)? [Gap, Exception Flow]
- [ ] CHK009 - Are requirements defined for empty or single-task goals? Does focus mode still apply? Do progress milestones (25/50/75/100%) still trigger? [Gap, Edge Case]

## Non-Functional Requirements

- [ ] CHK010 - Are accessibility requirements specified anywhere in the spec? No FR or NFR addresses keyboard navigation, screen reader support, color contrast, or WCAG compliance. [Gap]
- [ ] CHK011 - Are performance requirements defined for the web dashboard beyond CLI timing in SC-008? No page load time, rendering, or responsiveness targets exist. [Gap]
- [ ] CHK012 - Are security requirements for stored data specified? Brain dumps may contain sensitive personal information but no requirements address encryption at rest or data protection. [Gap]

## Assumptions & Dependencies

- [ ] CHK013 - Is the assumption "single AI provider" in §Assumptions validated against the implementation choice of Google Gemini? Are fallback or provider-switching requirements needed? [Assumption, Spec §Assumptions]
- [ ] CHK014 - Is the assumption of single-user (individual, not teams) reflected consistently? The data model includes a User entity but no requirements address what "single user" means for the SQLite-based architecture (multi-device? single device?). [Ambiguity, Spec §Assumptions]
- [ ] CHK015 - Are the success criteria SC-002 through SC-007 measurable without user research infrastructure? The spec defines metrics like "80% rated relevant" and "75% return rate" but no requirements exist for collecting this data. [Measurability, Spec §SC-002–SC-007]

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Link to relevant resources or documentation
- Items are numbered sequentially for easy reference
