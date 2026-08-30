# Story 4: Bug Capture & Reporting System (Mobile)

**Title:** Interactive Bug Click Handlers, Form Modal, & Scoring Verification

## Goal
Enable players to identify, capture, and officially report simulated bugs through an interactive reporting flow while enforcing anti-spam scoring rules.

## Target Requirements Mapped
- **RF04 - Bug Capture (Mobile):** Interactive layer or overlay triggering when a buggy element is clicked.
- **RF05 - Modal de Formatação de Bug (Mobile):** Form containing Bug Title, Description, and a Confirmation Submit button.
- **RF06 - Scoring:** Unique correct reports grant 1 point.
- **RNF02 - Performance:** Low-latency submission of bug reports.
- **RNF03 - Basic Anti-Spam:** Prevent the same bug from being reported more than once per player session.

## Tasks to be Completed
- [ ] Attach special invisible or subtle click/touch wrapper layers (or small floating "Report Bug" target icons) to the pre-seeded buggy elements in the store.
- [ ] Implement the Bug Report Modal component:
  - Input field for *Bug Title* (validated, minimum 3 characters).
  - Text area for *Bug Description* (validated, minimum 10 characters).
  - "Submit Report" button and "Cancel" button.
- [ ] Design the Bug Report submission backend action:
  - Ensure the modal passes the designated target's unique `bug_id` to prevent user fraud.
  - Check `localStorage` or query local state to ensure `bug_id` hasn't already been reported in the current session (basic anti-spam).
  - Write report to the `bug_reports` table on Supabase.
  - Increment the player's total `score` in the `players` table by 1 point on success.
  - Update the header's `Bugs Found` indicator on the frontend immediately.
  - Close the modal with a visual success toast or subtle animation.

## Acceptance Criteria
- [ ] Tapping on a seeded bug correctly opens the reporting modal and freezes the game timer/interaction briefly.
- [ ] Entering brief or invalid inputs in the modal prevents submission and guides the user.
- [ ] Successfully submitting a bug report registers the entry on Supabase, updates the score, incrementing it on the header in real-time.
- [ ] Attempting to report the same bug a second time displays a friendly "You've already reported this bug!" toast and prevents duplicate point counting.
